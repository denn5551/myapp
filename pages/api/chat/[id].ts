import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

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
  debug?: boolean;
};
type ErrorPayload = { ok: false; error: { message: string; code?: string | number; detail?: any } };
type OkPayload = {
  ok: true;
  message: { role: Role; content: Content };
  thread_id?: string;
  debug?: any;
};

const SAFE_ERROR_STATUS = 200; // чтобы фронт не падал на 5xx

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

const disableThreadReuse = process.env.DISABLE_THREAD_REUSE === "true";

// --- helpers ---------------------------------------------------------------
const getMimeFromUrl = (url: string): string => {
  const u = url.toLowerCase();
  if (u.endsWith(".png")) return "image/png";
  if (u.endsWith(".webp")) return "image/webp";
  if (u.endsWith(".gif")) return "image/gif";
  if (u.endsWith(".bmp")) return "image/bmp";
  if (u.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
};

// Преобразуем Content (строка или [{text}|{image_url}...]) в части Assistants v2
const buildAssistantContentParts = (content: Content) => {
  const parts: any[] = [];
  if (typeof content === "string") {
    const txt = content.trim();
    if (txt) parts.push({ type: "input_text", text: txt });
    return parts;
  }
  if (!Array.isArray(content)) return parts;

  const publicRoot = path.join(process.cwd(), "public");
  for (const p of content) {
    if (!p || typeof p !== "object") continue;
    if ((p as any).type === "text" && typeof (p as any).text === "string") {
      const txt = (p as any).text.trim();
      if (txt) parts.push({ type: "input_text", text: txt });
      continue;
    }
    if ((p as any).type === "image_url" && (p as any).image_url?.url) {
      const url: string = (p as any).image_url.url;
      try {
        if (url.startsWith("/")) {
          const abs = path.join(publicRoot, url);
          if (!abs.startsWith(publicRoot)) {
            parts.push({ type: "input_text", text: `Attachment (image): ${url}` });
            continue;
          }
          const buf = fs.readFileSync(abs);
          const b64 = buf.toString("base64");
          const mime = getMimeFromUrl(url);
          parts.push({ type: "input_image", image_data: { data: b64, mime_type: mime } });
        } else {
          parts.push({ type: "input_text", text: `Attachment (image url): ${url}` });
        }
      } catch {
        parts.push({ type: "input_text", text: `Attachment (image url): ${url}` });
      }
    }
  }
  return parts;
};

const pickLatestAssistantMessage = (messagesData: any) => {
  const assistantMessages = (messagesData?.data || [])
    .filter((m: any) => m.role === "assistant")
    .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0));
  return assistantMessages[0];
};
// ---------------------------------------------------------------------------

const handler = async (req: NextApiRequest, res: NextApiResponse<OkPayload | ErrorPayload>) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(SAFE_ERROR_STATUS).json({ ok: false, error: { message: "Method Not Allowed" } });
  }

  const body: ChatRequestBody | undefined = req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res
      .status(SAFE_ERROR_STATUS)
      .json({ ok: false, error: { message: "Invalid body: expected { messages: ChatMessage[] }" } });
  }
  if (!body.messages.every(isMessageValid)) {
    return res
      .status(SAFE_ERROR_STATUS)
      .json({ ok: false, error: { message: "Invalid message schema (roles or content parts)" } });
  }

  // ---------------- Assistants v2 ----------------
  if (body.assistant_id) {
    try {
      let threadId = disableThreadReuse ? undefined : body.thread_id;

      // 1) Создаём тред при необходимости
      if (!threadId) {
        const threadRes = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json",
          },
        });
        const threadText = await threadRes.text();
        if (!threadRes.ok) {
          return res.status(SAFE_ERROR_STATUS).json({
            ok: false,
            error: { message: "thread_create_failed", detail: threadText },
          });
        }
        const thread = JSON.parse(threadText);
        threadId = thread.id;
      }

      // 2) Кладём сообщение пользователя (vision parts)
      const lastMessage = body.messages[body.messages.length - 1];
      const contentParts = buildAssistantContentParts(lastMessage.content);

      const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "user", content: contentParts }),
      });
      const msgText = await msgRes.text();
      if (!msgRes.ok) {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "message_create_failed", detail: msgText },
        });
      }
      const createdMessage = JSON.parse(msgText);

      // 2.1) Верифицируем, что сообщение действительно в треде
      const verifyRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=5`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "messages_verify_failed", detail: verifyText },
        });
      }
      const verifyData = JSON.parse(verifyText);
      const hasUser = (verifyData?.data || []).some((m: any) => m.id === createdMessage.id || m.role === "user");
      if (!hasUser) {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "message_not_in_thread", detail: { createdMessage, verifySample: verifyData?.data } },
        });
      }

      // 3) Запускаем ран
      const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assistant_id: body.assistant_id }),
      });
      const runText = await runRes.text();
      if (!runRes.ok) {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "run_create_failed", detail: runText },
        });
      }
      const run = JSON.parse(runText);
      if (run.status === "failed") {
        return res.status(SAFE_ERROR_STATUS).json({ ok: false, error: { message: "assistant_unavailable" } });
      }

      // 4) Ожидаем завершение
      let status = run.status;
      let attempts = 0;
      while (status !== "completed" && status !== "failed" && attempts < 30) {
        await new Promise((r) => setTimeout(r, 1000));
        const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        });
        const statusData = await statusRes.json();
        status = statusData.status;
        attempts++;
      }
      if (status !== "completed") {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "assistant_status", detail: status },
        });
      }

      // 5) Забираем последние сообщения и берём самый новый ответ ассистента
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=20`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
      const messagesText = await messagesRes.text();
      if (!messagesRes.ok) {
        return res.status(SAFE_ERROR_STATUS).json({
          ok: false,
          error: { message: "messages_fetch_failed", detail: messagesText },
        });
      }
      const messagesData = JSON.parse(messagesText);
      const lastAssistantMessage = pickLatestAssistantMessage(messagesData);

      if (!lastAssistantMessage) {
        return res.status(200).json({
          ok: true,
          message: { role: "assistant", content: "Ассистент не дал ответа." },
          thread_id: threadId,
          debug: body.debug ? { contentParts, createdMessage, messagesSample: messagesData?.data?.slice(0, 3) } : undefined,
        });
      }

      return res.status(200).json({
        ok: true,
        message: { role: "assistant", content: lastAssistantMessage.content?.[0]?.text?.value ?? "" },
        thread_id: threadId,
        debug: body.debug ? { contentParts, lastAssistantId: lastAssistantMessage.id } : undefined,
      });
    } catch (e) {
      const err = normalizeError(e);
      return res.status(SAFE_ERROR_STATUS).json({ ok: false, error: err });
    }
  }

  // ---------------- Chat Completions fallback ----------------
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
      return res.status(SAFE_ERROR_STATUS).json({ ok: false, error: { message: "Empty response from OpenAI" } });
    }
    return res.status(200).json({
      ok: true,
      message: { role: (choice.role as Role) ?? "assistant", content: choice.content as Content },
    });
  } catch (e) {
    const err = normalizeError(e);
    return res.status(SAFE_ERROR_STATUS).json({ ok: false, error: err });
  }
};

export default handler;

export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};
