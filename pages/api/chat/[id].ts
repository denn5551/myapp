import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type Role = "system" | "user" | "assistant";
type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
type Content = string | Array<TextPart | ImagePart>;

export type ChatMessage = { role: Role; content: Content };
type ChatRequestBody = { 
  messages: ChatMessage[]; 
  model?: string; 
  temperature?: number; 
  maxTokens?: number;
  assistant_id?: string;
  thread_id?: string;
};
type ErrorPayload = { ok: false; error: { message: string; code?: string | number } };
type OkPayload = { ok: true; message: { role: Role; content: Content }; thread_id?: string };

const isContentValid = (c: unknown): c is Content => {
  if (typeof c === "string") return true;
  if (!Array.isArray(c)) return false;
  return c.every((p) => {
    if (typeof p !== "object" || p === null) return false;
    const anyp = p as any;
    if (anyp.type === "text") return typeof anyp.text === "string";
    if (anyp.type === "image_url") return anyp.image_url && typeof anyp.image_url.url === "string";
    return false;
  });
};

const isMessageValid = (m: unknown): m is ChatMessage => {
  if (!m || typeof m !== "object") return false;
  const msg = m as Record<string, unknown>;
  const roleOk = msg.role === "system" || msg.role === "user" || msg.role === "assistant";
  return roleOk && isContentValid(msg.content);
};

const normalizeError = (e: any) => {
  const data = e?.response?.data;
  const status = e?.response?.status;
  const message = data?.error?.message || e?.message || String(e);
  const code = status ?? data?.error?.type;
  return { message, code };
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const disableThreadReuse = process.env.DISABLE_THREAD_REUSE === 'true';

const handler = async (req: NextApiRequest, res: NextApiResponse<OkPayload | ErrorPayload>) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: { message: "Method Not Allowed" } });
  }

  const body: ChatRequestBody | undefined = req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res.status(400).json({ ok: false, error: { message: "Invalid body: expected { messages: ChatMessage[] }" } });
  }
  if (!body.messages.every(isMessageValid)) {
    return res.status(400).json({ ok: false, error: { message: "Invalid message schema (roles or content parts)" } });
  }

  // If assistant_id is provided, use assistant API
  if (body.assistant_id) {
    console.log('Using assistant API with ID:', body.assistant_id);
    try {
      let threadId = disableThreadReuse ? undefined : body.thread_id;
      
      if (!threadId) {
        console.log('Creating new thread...');
        const threadRes = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json',
          },
        });
        
        if (!threadRes.ok) {
          const t = await threadRes.text().catch(()=> '');
          console.error('THREAD CREATE FAILED', threadRes.status, threadRes.statusText, t);
          return res.status(500).json({ ok:false, error:{ message:'thread_create_failed' }});
        }
        
        const thread = await threadRes.json().catch(async () => {
          const t = await threadRes.text().catch(()=> '');
          console.error('THREAD PARSE FAILED', t);
          return null;
        });
        
        if (!thread?.id) {
          console.error('THREAD ID MISSING', thread);
          return res.status(500).json({ ok:false, error:{ message:'thread_missing' }});
        }
        
        threadId = thread.id;
        console.log('Thread created:', threadId);
      }

      // Convert messages to assistants v2 multimodal content
      // Variant A: pass image URLs as input_image parts
      const lastMessage = body.messages[body.messages.length - 1];
      const assistantContentParts: Array<any> = [];

      if (typeof lastMessage.content === 'string') {
        assistantContentParts.push({ type: 'input_text', text: lastMessage.content });
      } else if (Array.isArray(lastMessage.content)) {
        for (const part of lastMessage.content as any[]) {
          if (part?.type === 'text' && typeof part.text === 'string') {
            assistantContentParts.push({ type: 'input_text', text: part.text });
          } else if (part?.type === 'image_url' && part.image_url?.url) {
            assistantContentParts.push({ type: 'input_image', image_url: { url: part.image_url.url } });
          }
        }
      }

      console.log('Posting message to thread:', threadId, 'Content parts:', assistantContentParts.length);
      const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'user',
          content: assistantContentParts.length > 0
            ? assistantContentParts
            : [{ type: 'input_text', text: '' }],
        }),
      });
      
      if (!msgRes.ok) {
        const t = await msgRes.text().catch(()=> '');
        console.error('MESSAGE POST FAILED', msgRes.status, msgRes.statusText, t);
        return res.status(500).json({ ok:false, error:{ message:'message_post_failed' }});
      }
      
      console.log('Message posted successfully');

      const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assistant_id: body.assistant_id }),
      });

      if (!runRes.ok) {
        let bodyText = '';
        try { bodyText = await runRes.text(); } catch {}
        console.error('RUN START FAILED', {
          status: runRes.status,
          statusText: runRes.statusText,
          body: bodyText,
        });
        return res.status(500).json({ ok: false, error: { message: 'assistant_unavailable' } });
      }

      const run = await runRes.json();
      if (run.status === 'failed') {
        return res.status(500).json({ ok: false, error: { message: 'assistant_unavailable' } });
      }

      let status = run.status;
      let attempts = 0;
      while (status !== 'completed' && status !== 'failed' && attempts < 20) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
          },
        });
        if (!statusRes.ok) {
          let t = '';
          try { t = await statusRes.text(); } catch {}
          console.error('STATUS CHECK FAILED', statusRes.status, statusRes.statusText, t);
          return res.status(500).json({ ok: false, error: { message: 'assistant_unavailable' } });
        }
        const statusData = await statusRes.json();
        status = statusData.status;
        attempts++;
      }

      if (status !== 'completed') {
        return res.status(500).json({ ok: false, error: { message: 'assistant_unavailable' } });
      }

      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      const messagesData = await messagesRes.json();
      const lastAssistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');

      if (!lastAssistantMessage) {
        return res.status(200).json({
          ok: true,
          message: { role: 'assistant', content: 'Ассистент не дал ответа.' },
          thread_id: threadId,
        });
      }

      return res.status(200).json({
        ok: true,
        message: { 
          role: 'assistant', 
          content: lastAssistantMessage.content[0].text.value 
        },
        thread_id: threadId,
      });
    } catch (e: any) {
      const err = normalizeError(e);
      try {
        console.error('ASSISTANT ERROR', e?.response?.data || e?.message || String(e));
      } catch {}
      return res.status(500).json({ ok: false, error: err });
    }
  }

  // Fallback to direct chat completion
  const model = (body.model || "gpt-4o-mini").trim();
  const temperature = Number.isFinite(body.temperature) ? body.temperature! : 0.7;
  const max_tokens = Number.isFinite(body.maxTokens) ? Math.max(1, Math.floor(body.maxTokens!)) : 1024;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature,
      max_tokens,
      messages: body.messages as any,
    });
    const choice = completion.choices?.[0]?.message;
    if (!choice) {
      return res.status(502).json({ ok: false, error: { message: "Empty response from OpenAI" } });
    }
    return res.status(200).json({
      ok: true,
      message: { role: (choice.role as Role) ?? "assistant", content: choice.content as Content },
    });
  } catch (e) {
    const err = normalizeError(e);
    const status = typeof err.code === "number" ? err.code : 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({ ok: false, error: err });
  }
};

export default handler;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};
