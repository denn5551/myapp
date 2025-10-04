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
      const tr = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
      });
      const tdata = await tr.json();
      tid = tdata.id;
    }

    // 2) добавляем сообщение пользователя
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
    });
    if (!mr.ok) {
      const err = await mr.text();
      return res.status(500).json({ error: "send_message_failed", details: err });
    }

    // 3) запускаем run
    const rr = await fetch(`https://api.openai.com/v1/threads/${tid}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assistant_id }),
    });

    if (!rr.ok) {
      const err = await rr.text();
      return res.status(500).json({ error: "run_failed_to_start", details: err });
    }
    const run = await rr.json();

    // 4) ждём завершения
    let status = run.status;
    let lastError = run.last_error;
    let attempts = 0;
    while (status !== "completed" && status !== "failed" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      const sr = await fetch(
        `https://api.openai.com/v1/threads/${tid}/runs/${run.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );
      const sdata = await sr.json();
      status = sdata.status;
      lastError = sdata.last_error;
      attempts++;
    }

    if (status !== "completed") {
      return res.status(500).json({
        error: "assistant_unavailable",
        details: lastError || status,
      });
    }

    // 5) читаем последние сообщения и берём ответ ассистента (текст)
    const msgs = await fetch(
      `https://api.openai.com/v1/threads/${tid}/messages`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );
    const mdata = await msgs.json();
    const lastAssistant = (mdata?.data || []).find(
      (m: any) => m.role === "assistant"
    );

    const text =
      lastAssistant?.content?.[0]?.text?.value ||
      lastAssistant?.content?.[0]?.[Object.keys(lastAssistant?.content?.[0] || {})[0]]
        ?.value ||
      "";

    return res.json({
      ok: true,
      thread_id: tid,
      message: { role: "assistant", content: text },
    });
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: "assistant_error", details: e?.message || e });
  }
};

export default handler;
