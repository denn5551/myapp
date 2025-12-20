// components/chat/ChatInput.tsx
import React, { useMemo, useRef, useState } from "react";

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

function absUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  try {
    const origin =
      (typeof window !== "undefined" && window.location?.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const autoresize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  const canSend = useMemo(
    () => (text.trim().length > 0 || attachments.length > 0) && !busy,
    [text, attachments, busy]
  );

  const pickFiles = () => fileInputRef.current?.click();

  const normalizeUploaded = (files: any[]): UploadedFile[] =>
    (files || []).map((f: any) => ({
      url: f.url,
      name: f.name ?? "file",
      type: f.type,
      size: f.size,
      isImage:
        typeof f.isImage === "boolean" ? f.isImage : /^image\//.test(f.type ?? ""),
    }));

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({} as any));
      if (r.ok && data?.ok && Array.isArray(data.files)) {
        setAttachments((prev) => [...prev, ...normalizeUploaded(data.files)]);
      } else {
        setError("Ошибка загрузки файлов");
      }
    } catch {
      setError("Ошибка загрузки файлов");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSend = async () => {
    if (!assistantId || !canSend) return;

    const userMessage = text.trim();
    
    // Добавляем пользовательское сообщение сразу
    onMessageSent?.(true, undefined, undefined, userMessage);
    
    setBusy(true);
    setError(null);

    const parts: any[] = [];
    const plain = userMessage;
    if (plain) parts.push({ type: "text", text: plain });

    const linksForText: string[] = [];
    for (const f of attachments) {
      const isImg = f.isImage || /^image\//.test(f.type || "");
      const url = absUrl(f.url);
      if (isImg) {
        parts.push({ type: "image_url", image_url: { url } });
        linksForText.push(`[file] ${f.name}: ${url}`);
      } else {
        linksForText.push(`[file] ${f.name}: ${url}`);
      }
    }
    if (linksForText.length) {
      const add = (plain ? "\n\n" : "") + linksForText.join("\n");
      if (parts.length && parts[0].type === "text") parts[0].text += add;
      else parts.unshift({ type: "text", text: add });
    }

    const body = { assistant_id: assistantId, thread_id: threadId || undefined, content: parts };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch {}

      if (!res.ok || data?.error) {
        throw new Error(data?.details?.message || data?.error || `HTTP ${res.status}`);
      }

      // Обновляем thread_id и добавляем ответ ассистента
      onMessageSent?.(true, data.thread_id, data?.message?.content, undefined);
      
      setText("");
      setAttachments([]);
      requestAnimationFrame(autoresize);
    } catch (e: any) {
      setError(e?.message || "Ошибка отправки сообщения");
      // Удаляем пользовательское сообщение в случае ошибки
      onMessageSent?.(false, undefined, undefined, userMessage);
    } finally {
      setBusy(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;
    const files: File[] = [];
    for (const it of items as unknown as DataTransferItem[]) {
      if (it.kind === "file") {
        const f = (it as any).getAsFile?.();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      await uploadFiles(files);
    }
  };

return (
  <div className="w-full">
{/* Карточка чата */}

<div
  className="rounded-2xl bg-base-100"
  style={{
    border: "1.5px solid #dde2e8",
    boxShadow: "0 4px 16px rgba(60,67,80,0.07)",
    padding: "16px 18px 22px 18px",
    maxWidth: "100%",
    position: "relative"
  }}
>
  {/* Вложения (верх) */}
  {attachments.length > 0 && (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((file, idx) => (
        <div key={`${file.url}-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-base-300">
          {file.isImage ? (
            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-base-200 flex items-center justify-center text-xs">📄</div>
          )}
          <button
            type="button"
            aria-label="Удалить файл"
            onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
            className="absolute -top-2 -right-2 btn btn-xs btn-circle bg-base-100 border border-base-300 hover:bg-error hover:text-error-content"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Текстовая область (центр) */}
  <div style={{ width: "100%", position: "relative", marginBottom: "44px" }}>
    <textarea
      ref={taRef}
      value={text}
      onChange={e => { setText(e.target.value); autoresize(); }}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      onDragOver={e => e.preventDefault()}
      onDrop={async e => { e.preventDefault(); await uploadFiles(Array.from(e.dataTransfer.files || [])); }}
      className="chat-inputarea scrollbar-none"
      placeholder="Напишите сообщение… (Ctrl/⌘+Enter — отправить)"
      rows={1}
      style={{
        border: "none",
        outline: "none",
        boxShadow: "none",
        fontSize: "1.08rem",
        lineHeight: 1.65,
        color: "#2a313b",
        resize: "none",
        minHeight: 48,
        maxHeight: 160,
        width: "100%",
        padding: "14px 0 0 0",
        background: "transparent"
      }}
      disabled={busy}
      aria-label="Поле ввода сообщения"
    />
  </div>

  {/* Кнопки (нижний правый угол) */}
  <div style={{
    position: "absolute",
    right: 18,
    bottom: 18,
    display: "flex",
    alignItems: "center",
    gap: "6px"
  }}>
    <button
      type="button"
      onClick={pickFiles}
      title="Прикрепить файл"
      style={{
        background: "none",
        border: "none",
        outline: "none",
        padding: 0,
        width: 34,
        height: 34,
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
        cursor: busy ? "not-allowed" : "pointer"
      }}
      tabIndex={-1}
      aria-label="Прикрепить файл"
      disabled={busy}
    >
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#98a6b7" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 16l-3.5-3.5a5 5 0 117.1-7.1l7.1 7.1a4 4 0 01-5.65 5.66L5.35 12.35a3 3 0 014.24-4.24l5.79 5.79"></path>
      </svg>
    </button>
    <button
      type="button"
      onClick={handleSend}
      disabled={!canSend}
      title="Отправить"
      style={{
        background: "#49b4f9",
        border: "none",
        borderRadius: "11px",
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: !canSend ? "not-allowed" : "pointer",
        opacity: canSend ? 1 : 0.45,
        boxShadow: "0 2px 8px rgba(73,180,249,0.16)",
        marginRight: 0,
        transition: "background 0.18s"
      }}
      aria-label="Отправить"
    >
      {busy ? (
        <span className="loading loading-spinner loading-xs" />
      ) : (
        <svg width={20} height={22} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 5l7 7-7 7" />
        </svg>
      )}
    </button>
    {/* скрытый input */}
    <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      multiple
      accept="image/*"
      onChange={async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length) await uploadFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
    />
  </div>

      {/* статус/ошибки */}
      {error && (
        <div className="px-4 pb-3">
          <div className="alert alert-error">{error}</div>
        </div>
      )}
    </div>
  </div>
);
}
export default ChatInput;
