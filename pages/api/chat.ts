// pages/api/chat.ts
import type { NextApiRequest, NextApiResponse } from "next";

const DISABLE_REUSE = process.env.NEXT_PUBLIC_DISABLE_THREAD_REUSE === "true";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("Chat API request received:", {
    method: req.method,
    bodyKeys: Object.keys(req.body || {}),
    assistant_id: req.body?.assistant_id,
    thread_id: req.body?.thread_id,
    contentLength: Array.isArray(req.body?.content) ? req.body.content.length : 0,
  });

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
      console.log("Creating new thread...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const tr = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!tr.ok) {
        const errorText = await tr.text();
        console.error("Thread creation failed:", { status: tr.status, statusText: tr.statusText, error: errorText });
        return res.status(500).json({ 
          error: "thread_creation_failed", 
          details: `Status ${tr.status}: ${errorText}` 
        });
      }
      
      const tdata = await tr.json();
      tid = tdata.id;
      console.log("Thread created successfully:", tid);
    } else {
      console.log("Using existing thread:", tid);
    }

    // 2) добавляем сообщение пользователя
    console.log("Adding user message to thread:", tid);
    const controller1 = new AbortController();
    const timeoutId1 = setTimeout(() => controller1.abort(), 10000); // 10 second timeout
    
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
      signal: controller1.signal,
    });
    
    clearTimeout(timeoutId1);
    
    if (!mr.ok) {
      const err = await mr.text();
      console.error("Message sending failed:", { status: mr.status, statusText: mr.statusText, error: err });
      return res.status(500).json({ error: "send_message_failed", details: err });
    }
    console.log("User message sent successfully");

    // 3) запускаем run
    console.log("Starting run for assistant:", assistant_id);
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 10000); // 10 second timeout
    
    const rr = await fetch(`https://api.openai.com/v1/threads/${tid}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_id }),
      signal: controller2.signal,
    });

    clearTimeout(timeoutId2);
    
    if (!rr.ok) {
      const err = await rr.text();
      console.error("Run creation failed:", { status: rr.status, statusText: rr.statusText, error: err });
      return res.status(500).json({ error: "run_failed_to_start", details: err });
    }
    const run = await rr.json();
    console.log("Run started successfully:", run.id, "Status:", run.status);

    // 4) ждём завершения
    let status = run.status;
    let lastError = run.last_error;
    let attempts = 0;
    const maxAttempts = 60; // Increased from 30 to 60
    
    console.log("Waiting for run completion. Current status:", status, "Max attempts:", maxAttempts);
    
    while (status !== "completed" && status !== "failed" && status !== "cancelled" && status !== "expired" && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 1000));
      attempts++;
      
      console.log(`Checking run status (attempt ${attempts}/${maxAttempts}):`, run.id);
      
      try {
        const controller3 = new AbortController();
        const timeoutId3 = setTimeout(() => controller3.abort(), 10000); // 10 second timeout
        
        const sr = await fetch(
          `https://api.openai.com/v1/threads/${tid}/runs/${run.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2",
            },
            signal: controller3.signal,
          }
        );
        
        clearTimeout(timeoutId3);
        
        if (!sr.ok) {
          const errorText = await sr.text();
          console.error("Status check failed:", { status: sr.status, statusText: sr.statusText, error: errorText });
          throw new Error(`Status check failed: ${sr.status} - ${errorText}`);
        }
        
        const sdata = await sr.json();
        status = sdata.status;
        lastError = sdata.last_error;
        
        console.log(`Run status updated: ${status}`);
        
        if (status === "requires_action" || status === "cancelling") {
          console.warn(`Unexpected run status: ${status}. Ending loop.`);
          break;
        }
      } catch (error: any) {
        console.error("Error checking run status:", error.message);
        if (error.name === 'AbortError') {
          console.error("Status check request timed out");
          throw new Error('Status check timeout');
        }
        throw error;
      }
    }

    if (status !== "completed") {
      console.error("Run did not complete successfully:", { status, lastError });
      return res.status(500).json({
        error: "assistant_unavailable",
        details: lastError || status,
      });
    }
    console.log("Run completed successfully");

    // 5) читаем последние сообщения и берём ответ ассистента (текст)
    console.log("Fetching assistant messages...");
    const controller4 = new AbortController();
    const timeoutId4 = setTimeout(() => controller4.abort(), 10000); // 10 second timeout
    
    const msgs = await fetch(
      `https://api.openai.com/v1/threads/${tid}/messages`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        signal: controller4.signal,
      }
    );
    
    clearTimeout(timeoutId4);
    
    if (!msgs.ok) {
      const errorText = await msgs.text();
      console.error("Message fetch failed:", { status: msgs.status, statusText: msgs.statusText, error: errorText });
      return res.status(500).json({ error: "fetch_messages_failed", details: errorText });
    }
    
    const mdata = await msgs.json();
    console.log("Messages fetched, total:", mdata?.data?.length || 0);
    
    const lastAssistant = (mdata?.data || []).find(
      (m: any) => m.role === "assistant"
    );

    const text =
      lastAssistant?.content?.[0]?.text?.value ||
      lastAssistant?.content?.[0]?.[Object.keys(lastAssistant?.content?.[0] || {})[0]]
        ?.value ||
      "";

    console.log("Assistant response generated successfully");
    
    return res.json({
      ok: true,
      thread_id: tid,
      message: { role: "assistant", content: text },
    });
  } catch (e: any) {
    console.error("Chat API error:", {
      message: e.message,
      stack: e.stack,
      name: e.name,
    });
    
    // Handle specific error types
    if (e.name === 'AbortError') {
      return res.status(500).json({ 
        error: "request_timeout", 
        details: "Request to OpenAI API timed out" 
      });
    }
    
    return res
      .status(500)
      .json({ error: "assistant_error", details: e?.message || e });
  }
};

export default handler;
