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

async function chatCompletionsFallback(body: ChatRequestBody) {
  const model = (body.model || "gpt-4o-mini").trim();
  const temperature = Number.isFinite(body.temperature) ? body.temperature! : 0.7;
  const max_tokens = Number.isFinite(body.maxTokens) ? Math.max(1, Math.floor(body.maxTokens!)) : 1024;

  const completion = await client.chat.completions.create({
    model,
    temperature,
    max_tokens,
    messages: body.messages as any,
  });
  const choice = completion.choices?.[0]?.message;
  const role = (choice?.role as Role) ?? "assistant";
  const content = (choice?.content as Content) ?? "";
  return { role, content };
}

const handler = async (req: NextApiRequest, res: NextApiResponse<OkPayload | ErrorPayload>) => {
  console.log("Chat [id] API request received:", {
    method: req.method,
    bodyKeys: Object.keys(req.body || {}),
    assistant_id: req.body?.assistant_id,
    thread_id: req.body?.thread_id,
    messagesLength: Array.isArray(req.body?.messages) ? req.body.messages.length : 0,
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(200).json({ ok: false, error: { message: "Method Not Allowed" } });
  }

  const body: ChatRequestBody | undefined = req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return res
      .status(200)
      .json({ ok: false, error: { message: "Invalid body: expected { messages: ChatMessage[] }" } });
  }
  if (!body.messages.every(isMessageValid)) {
    return res.status(200).json({ ok: false, error: { message: "Invalid message schema (roles or content parts)" } });
  }

  // ---------------- Assistants v2 (с фолбэком) ----------------
  if (body.assistant_id) {
    try {
      let threadId = disableThreadReuse ? undefined : body.thread_id;

      // 1) Создаём тред при необходимости
      if (!threadId) {
        console.log("Creating new thread for assistant:", body.assistant_id);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const threadRes = await fetch("https://api.openai.com/v1/threads", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!threadRes.ok) {
          const errorText = await threadRes.text();
          console.error("Thread creation failed:", { status: threadRes.status, statusText: threadRes.statusText, error: errorText });
          throw new Error(`thread_create_failed: Status ${threadRes.status} - ${errorText}`);
        }
        
        const threadText = await threadRes.text();
        const thread = JSON.parse(threadText);
        threadId = thread.id;
        console.log("Thread created successfully:", threadId);
      } else {
        console.log("Using existing thread:", threadId);
      }

      // 2) Кладём сообщение пользователя (vision parts)
      const lastMessage = body.messages[body.messages.length - 1];
      const contentParts = buildAssistantContentParts(lastMessage.content);
      console.log("Adding user message to thread:", threadId, "Content parts count:", contentParts.length);

      const controller1 = new AbortController();
      const timeoutId1 = setTimeout(() => controller1.abort(), 10000); // 10 second timeout
      
      const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "user", content: contentParts }),
        signal: controller1.signal,
      });
      
      clearTimeout(timeoutId1);
      
      if (!msgRes.ok) {
        const errorText = await msgRes.text();
        console.error("Message creation failed:", { status: msgRes.status, statusText: msgRes.statusText, error: errorText });
        throw new Error(`message_create_failed: Status ${msgRes.status} - ${errorText}`);
      }
      console.log("User message sent successfully");

      // 3) Запускаем ран
      console.log("Starting run for assistant:", body.assistant_id);
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 10000); // 10 second timeout
      
      const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assistant_id: body.assistant_id }),
        signal: controller2.signal,
      });
      
      clearTimeout(timeoutId2);
      
      if (!runRes.ok) {
        const errorText = await runRes.text();
        console.error("Run creation failed:", { status: runRes.status, statusText: runRes.statusText, error: errorText });
        throw new Error(`run_create_failed: Status ${runRes.status} - ${errorText}`);
      }
      
      const runText = await runRes.text();
      const run = JSON.parse(runText);
      console.log("Run started successfully:", run.id, "Status:", run.status);
      
      if (run.status === "failed") {
        console.error("Run failed immediately:", run.last_error);
        throw new Error(`assistant_unavailable: ${JSON.stringify(run.last_error)}`);
      }

      // 4) Ожидаем завершение
      let status = run.status;
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
          
          const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
            headers: {
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "OpenAI-Beta": "assistants=v2",
            },
            signal: controller3.signal,
          });
          
          clearTimeout(timeoutId3);
          
          if (!statusRes.ok) {
            const errorText = await statusRes.text();
            console.error("Status check failed:", { status: statusRes.status, statusText: statusRes.statusText, error: errorText });
            throw new Error(`Status check failed: ${statusRes.status} - ${errorText}`);
          }
          
          const statusData = await statusRes.json();
          status = statusData.status;
          
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
        console.error("Run did not complete successfully:", { status, run });
        throw new Error(`assistant_status: ${status}`);
      }
      console.log("Run completed successfully");

      // 5) Забираем последний ответ ассистента
      console.log("Fetching assistant messages...");
      const controller4 = new AbortController();
      const timeoutId4 = setTimeout(() => controller4.abort(), 10000); // 10 second timeout
      
      const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages?order=desc&limit=20`, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        signal: controller4.signal,
      });
      
      clearTimeout(timeoutId4);
      
      if (!messagesRes.ok) {
        const errorText = await messagesRes.text();
        console.error("Messages fetch failed:", { status: messagesRes.status, statusText: messagesRes.statusText, error: errorText });
        throw new Error(`messages_fetch_failed: Status ${messagesRes.status} - ${errorText}`);
      }
      
      const messagesText = await messagesRes.text();
      const messagesData = JSON.parse(messagesText);
      console.log("Messages fetched, total:", messagesData?.data?.length || 0);
      
      const lastAssistantMessage = pickLatestAssistantMessage(messagesData);

      const content =
        lastAssistantMessage?.content?.[0]?.text?.value ??
        "Ассистент не дал ответа.";

      console.log("Assistant response generated successfully");
      
      return res.status(200).json({
        ok: true,
        message: { role: "assistant", content },
        thread_id: threadId,
        debug: body.debug ? { contentParts } : undefined,
      });
    } catch (e: any) {
      console.error("Assistant API error:", {
        message: e.message,
        stack: e.stack,
        name: e.name,
      });
      
      // Handle specific error types
      if (e.name === 'AbortError') {
        return res.status(200).json({ 
          ok: false, 
          error: { 
            message: "request_timeout", 
            detail: "Request to OpenAI API timed out" 
          } 
        });
      }
      
      // ФОЛБЭК НА CHAT COMPLETIONS — чтобы UI отвечал
      const err = e instanceof Error ? e.message : String(e);
      try {
        const fallback = await chatCompletionsFallback(body);
        return res.status(200).json({
          ok: true,
          message: fallback,
          debug: body.debug ? { fallbackFrom: err } : undefined,
        });
      } catch (e2: any) {
        const err2 = normalizeError(e2);
        return res.status(200).json({
          ok: false,
          error: { message: "assistants_and_fallback_failed", detail: { assistantsError: err, fallbackError: err2 } },
        });
      }
    }
  }

  // ---------------- Чистый Chat Completions ----------------
  try {
    const fallback = await chatCompletionsFallback(body);
    return res.status(200).json({ ok: true, message: fallback });
  } catch (e: any) {
    console.error("Fallback API error:", {
      message: e.message,
      stack: e.stack,
      name: e.name,
    });
    
    // Handle specific error types in fallback
    if (e.name === 'AbortError') {
      return res.status(200).json({ 
        ok: false, 
        error: { 
          message: "request_timeout", 
          detail: "Request to OpenAI API timed out" 
        } 
      });
    }
    
    const err = normalizeError(e);
    return res.status(200).json({ ok: false, error: err });
  }
};

export default handler;

export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};
