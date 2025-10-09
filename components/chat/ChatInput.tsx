// components/chat/ChatInput.tsx
import React, { useCallback, useMemo, useState } from "react";
import ChatUploader from "./ChatUploader";

export type UploadedFile = {
  url: string;
  name: string;
  type?: string;
  size?: number;
  isImage?: boolean;
};

type Props = {
  threadId?: string;
  assistantId?: string;
  onMessageSent?: (
    ok: boolean,
    newThreadId?: string,
    response?: string,
    userMessage?: string
  ) => void;
};

/* ---------- мини-логгер ---------- */
const ts = () => new Date().toISOString().split("T")[1].replace("Z", "");
const group = (title: string) => console.groupCollapsed(`${title}  @${ts()}`);
const end = () => console.groupEnd();
/* --------------------------------- */

/** Делает абсолютный URL для ассистентов */
function absUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  // если пришёл относительный путь вроде /uploads/..., добавим origin
  try {
    const origin =
      (typeof window !== "undefined" && window.location?.origin) ||
      process.env.NEXT_PUBLIC_APP_URL || // можно задать в .env
      "";
    return origin ? `${origin.replace(/\/$/, "")}/${url.replace(/^\//, "")}` : url;
  } catch {
    return url;
  }
}

const ChatInput: React.FC<Props> = ({ threadId, assistantId, onMessageSent }) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = useCallback((items: UploadedFile[]) => {
    group("UPLOAD ▶ onFilesChange");
    console.log("files:", items);
    end();
    setAttachments(items || []);
  }, []);

  const canSend = useMemo(
    () => (text.trim().length > 0 || attachments.length > 0) && !busy,
    [text, attachments, busy]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSend = async () => {
    group("CHAT ▶ handleSend");

    if (!assistantId) {
      console.warn("assistant_id отсутствует");
      setError("assistant_id отсутствует");
      end();
      return;
    }
    if (!canSend) {
      console.warn("Нечего отправлять (нет текста/вложений или busy)");
      end();
      return;
    }

    setBusy(true);
    setError(null);

    // 1) Собираем content[]
    const parts: any[] = [];
    const plain = text.trim();
    if (plain) parts.push({ type: "text", text: plain });

    const linksForText: string[] = [];
    for (const f of attachments) {
      const isImg = f.isImage || /^image\//.test(f.type || "");
      if (isImg) {
        const url = absUrl(f.url);
        parts.push({ type: "image_url", image_url: { url } });
      } else {
        linksForText.push(`[file] ${f.name}: ${absUrl(f.url)}`);
      }
    }
    if (linksForText.length) {
      const add = (plain ? "\n\n" : "") + linksForText.join("\n");
      if (parts.length && parts[0].type === "text") parts[0].text += add;
      else parts.unshift({ type: "text", text: add });
    }

    console.log("assistantId:", assistantId);
    console.log("threadId:", threadId);
    console.log("content[]:", parts);

    if (parts.length === 0) {
      console.warn("Пустое сообщение — content[] пустой");
      setBusy(false);
      setError("Пустое сообщение");
      end();
      return;
    }

    // 2) Шлём запрос
    const body = {
      assistant_id: assistantId,
      thread_id: threadId || undefined,
      content: parts,
    };
    console.log("POST /api/chat body:", body);

    const t0 = performance.now();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      const dt = performance.now() - t0;

      console.log(`response status: ${res.status} (${dt.toFixed(0)} ms)`);
      console.log("response raw:", rawText);

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        console.warn("Ответ не JSON, разобрал как текст");
      }

      if (!res.ok || data?.error) {
        console.error("Server returned error:", data);
        throw new Error(
          data?.details?.message || data?.error || `HTTP ${res.status}`
        );
      }

      // 3) Успех — чистим локальное состояние
      const userMessage = text.trim();
      setText("");
      setAttachments([]);
      setError(null);

      console.log("onMessageSent ok, thread:", data.thread_id, "resp:", data?.message?.content);
      onMessageSent?.(true, data.thread_id, data?.message?.content, userMessage);
    } catch (e: any) {
      console.error("SEND FAILED:", e?.message || e);
      setError(e?.message || "Ошибка отправки сообщения");
      onMessageSent?.(false);
    } finally {
      setBusy(false);
      end();
    }
  };

  // Вставка из буфера: загрузим файлы и добавим к attachments
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;

    const files: File[] = [];
    for (const it of items as unknown as DataTransferItem[]) {
      if (it.kind === "file") {
        const f = (it as any).getAsFile?.();
        if (f) files.push(f);
      }
    }
    if (!files.length) return;

    e.preventDefault();
    group("UPLOAD ▶ paste");
    console.log(
      "files from clipboard:",
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const t0 = performance.now();
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const raw = await r.text();
      const dt = performance.now() - t0;

      console.log(`upload status: ${r.status} (${dt.toFixed(0)} ms)`);
      console.log("upload raw:", raw);

      let data: any = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!r.ok || !data?.ok || !Array.isArray(data.files)) {
        console.error("UPLOAD FAILED:", data);
        throw new Error(data?.error || "Upload failed");
      }
      console.log("uploaded files payload:", data.files);
      setAttachments((prev) => [...prev, ...data.files]);
    } catch (err: any) {
      console.error("paste upload error:", err?.message || err);
      setError("Ошибка загрузки из буфера обмена");
    } finally {
      end();
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200 p-3">
      <textarea
        className="min-h-[80px] w-full resize-y rounded-xl border border-gray-200 p-3 outline-none focus:border-gray-300"
        placeholder="Напишите сообщение… (Ctrl/⌘+Enter — отправить)"
        aria-label="Поле ввода сообщения"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
      />

      <div className="mt-3 chat-attachments">
        {/* Важно: ChatUploader должен вызывать onFilesChange([...UploadedFile]) */}
        <ChatUploader onFilesChange={handleFilesChange} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {busy ? "Отправляем…" : "Готово к отправке"}
        </div>
        <button
          type="button"
          className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90 focus:outline-none disabled:opacity-50"
          onClick={handleSend}
          disabled={!canSend}
        >
          Отправить
        </button>
      </div>

      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

      {/* ГЛОБАЛЬНО уменьшаем превью внутри ChatUploader */}
      <style jsx global>{`
        .chat-attachments img {
          width: 80px !important;
          height: auto !important;
          object-fit: cover !important;
          border-radius: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default ChatInput;

