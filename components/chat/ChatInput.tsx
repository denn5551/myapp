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

    setBusy(true);
    setError(null);

    const parts: any[] = [];
    const plain = text.trim();
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

      const userMessage = text.trim();
      setText("");
      setAttachments([]);
      onMessageSent?.(true, data.thread_id, data?.message?.content, userMessage);
      requestAnimationFrame(autoresize);
    } catch (e: any) {
      setError(e?.message || "Ошибка отправки сообщения");
      onMessageSent?.(false);
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
      {/* Обёртка поля (красивая карточка, как у DaisyUI) */}
      <div className="rounded-2xl border border-base-300 bg-base-100">
        <div className="relative p-3">

          {/* превью вложений */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
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

          {/* поле ввода */}
          <div className="relative">
            <textarea
              ref={taRef}
              className="textarea textarea-bordered w-full resize-none min-h-[52px] max-h-[140px] pr-20 pl-3 py-3 rounded-xl leading-6
                         bg-white text-base-content placeholder:text-base-content/40 scrollbar-none
                         focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Напишите сообщение…  (Ctrl/⌘+Enter — отправить)"
              aria-label="Поле ввода сообщения"
              value={text}
              onChange={(e) => { setText(e.target.value); autoresize(); }}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => { e.preventDefault(); await uploadFiles(Array.from(e.dataTransfer.files || [])); }}
              rows={1}
            />

            {/* скрепка — слева от «отправить», идеально по центру */}
            <button
              type="button"
              onClick={pickFiles}
              title="Прикрепить файлы"
              className="absolute right-12 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-md
                         text-base-content/80 hover:bg-base-200/70 active:scale-95 transition focus:outline-none"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-80">
                <path
                  d="M16.5 6.5l-7.78 7.78a3 3 0 004.24 4.24l7.07-7.07a5 5 0 10-7.07-7.07L6.1 10.15"
                  fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* отправить — цветная, без серой подложки в disabled */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              title="Отправить"
              className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-9 h-9 rounded-md
                          focus:outline-none focus:ring-0 transition
                          ${canSend ? "bg-primary text-primary-content hover:brightness-95" : "bg-base-200 text-base-content/40 cursor-not-allowed"}`}
            >
              {busy ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path d="M5 12h13M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        </div>

        {/* статус/ошибки — «готово к отправке» убрали */}
        {error && <div className="px-4 pb-3"><div className="alert alert-error">{error}</div></div>}
      </div>
    </div>
  );
};

export default ChatInput;
