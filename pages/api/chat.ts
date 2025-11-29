// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

const DISABLE_REUSE = process.env.NEXT_PUBLIC_DISABLE_THREAD_REUSE === "true";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { assistant_id, thread_id, content } = req.body || {};
  if (!assistant_id || !Array.isArray(content) || !content.length) {
    return res
      .status(400)
      .json({ error: "Bad Request: assistant_id and content[] required" });
  }

  try {
    // 1) создаём/берём thread
    let tid = DISABLE_REUSE ? null : (thread_id as string | null) || null;

    if (!tid) {
      console.log("Creating new thread for assistant:", assistant_id);
      const tr = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      if (!tr.ok) {
        const errorText = await tr.text();
        console.error("Failed to create thread:", errorText);
        return res.status(500).json({ 
          error: "thread_creation_failed", 
          details: errorText,
          status: tr.status 
        });
      }
      
      const tdata = await tr.json();
      tid = tdata.id;
      console.log("Created new thread:", tid);
    } else {
      console.log("Using existing thread:", tid);
    }

    // 2) добавляем сообщение пользователя
    console.log("Adding user message to thread:", tid);
    const mr = await fetch(`https://api.openai.com/v1/threads/${tid}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "user",
        content, // массив parts [{type:'text',text},{type:'image_url',{url}}]
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!mr.ok) {
      const err = await mr.text();
      console.error("Failed to add message to thread:", err);
      return res.status(500).json({ 
        error: "send_message_failed", 
        details: err,
        status: mr.status 
      });
    }
    console.log("Message added successfully to thread:", tid);

    // 3) запускаем run
    console.log("Starting run for thread:", tid, "assistant:", assistant_id);
    const rr = await fetch(`https://api.openai.com/v1/threads/${tid}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_id }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!rr.ok) {
      const err = await rr.text();
      console.error("Failed to start run:", err);
      return res.status(500).json({ 
        error: "run_failed_to_start", 
        details: err,
        status: rr.status 
      });
    }
    const run = await rr.json();
    console.log("Run started successfully:", run.id);

    // 4) ждём завершения
    let status = run.status;
    let lastError = run.last_error;
    let attempts = 0;
    const maxAttempts = 60; // Increased attempts to allow more time
    
    console.log(`Starting to poll for run completion. Current status: ${status}`);
    
    while (status !== "completed" && status !== "failed" && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      
      try {
        const sr = await fetch(
          `https://api.openai.com/v1/threads/${tid}/runs/${run.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2",
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        );
        
        if (!sr.ok) {
          const errorText = await sr.text();
          console.error(`Failed to get run status: ${sr.status}`, errorText);
          return res.status(500).json({ 
            error: "run_status_check_failed", 
            details: errorText,
            status: sr.status 
          });
        }
        
        const sdata = await sr.json();
        status = sdata.status;
        lastError = sdata.last_error;
        
        console.log(`Run status after ${attempts}s: ${status}`);
        
        // Check for timeout
        if (attempts >= maxAttempts) {
          console.error("Run polling timed out after", maxAttempts, "attempts");
          break;
        }
      } catch (pollError: any) {
        console.error("Polling error:", pollError.message);
        return res.status(500).json({ 
          error: "polling_error", 
          details: pollError?.message || pollError 
        });
      }
    }

    if (status !== "completed") {
      console.error("Run did not complete successfully. Status:", status, "Last error:", lastError);
      return res.status(500).json({
        error: "assistant_unavailable",
        details: lastError || status,
        status: status
      });
    }

    // 5) читаем последние сообщения и берём ответ ассистента (текст)
    console.log("Fetching messages from thread:", tid);
    const msgs = await fetch(
      `https://api.openai.com/v1/threads/${tid}/messages`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    );
    
    if (!msgs.ok) {
      const errorText = await msgs.text();
      console.error("Failed to fetch messages:", errorText);
      return res.status(500).json({ 
        error: "fetch_messages_failed", 
        details: errorText,
        status: msgs.status 
      });
    }
    
    const mdata = await msgs.json();
    const lastAssistant = (mdata?.data || []).find(
      (m: any) => m.role === "assistant"
    );

    const text =
      lastAssistant?.content?.[0]?.text?.value ||
      lastAssistant?.content?.[0]?.[Object.keys(lastAssistant?.content?.[0] || {})[0]]
        ?.value ||
      "";

    console.log("Successfully retrieved assistant response from thread:", tid);
    
    return res.json({
      ok: true,
      thread_id: tid,
      message: { role: "assistant", content: text },
    });
  } catch (e: any) {
    console.error("Unexpected error in chat API:", e);
    
    // Handle timeout errors specifically
    if (e.name === 'AbortError') {
      return res.status(500).json({ 
        error: "request_timeout", 
        details: "Request to OpenAI API timed out" 
      });
    }
    
    return res
      .status(500)
      .json({ 
        error: "assistant_error", 
        details: e?.message || e?.toString() || "Unknown error" 
      });
  }
};

export default handler;
