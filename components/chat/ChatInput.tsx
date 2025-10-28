// components/chat/ChatInput.tsx
import React, { useCallback, useMemo, useState } from "react";

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
        // Также добавляем ссылку в текст для отображения в чате
        linksForText.push(`[file] ${f.name}: ${url}`);
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
    <div className="w-full">
      {/* Поле ввода с встроенными вложениями */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        {/* Миниатюры изображений */}
        {attachments.length > 0 && (
          <div className="divider m-0 p-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={`${file.url}-${index}`} className="relative group">
                  {file.isImage ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-24 h-24 object-cover rounded-lg border border-base-300"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-base-200 rounded-lg border border-base-300 flex items-center justify-center">
                      <span className="text-xs text-base-content">📄</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="btn btn-sm btn-circle btn-error absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Основное поле ввода */}
        <div className="card-body p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                className="textarea textarea-bordered w-full resize-none min-h-[52px] max-h-[140px] pr-12"
                placeholder="Напишите сообщение… (Ctrl/⌘+Enter — отправить)"
                aria-label="Поле ввода сообщения"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    try {
                      const fd = new FormData();
                      for (const f of files) fd.append("files", f);
                      const r = await fetch("/api/upload", { method: "POST", body: fd });
                      const data = await r.json().catch(() => ({} as any));
                      if (r.ok && data?.ok && Array.isArray(data.files)) {
                        const normalized: UploadedFile[] = data.files.map((f: any) => ({
                          url: f.url,
                          name: f.name ?? "file",
                          type: f.type,
                          size: f.size,
                          isImage: typeof f.isImage === "boolean" ? f.isImage : /^image\//.test(f.type ?? "")
                        }));
                        setAttachments(prev => [...prev, ...normalized]);
                      }
                    } catch (err) {
                      setError("Ошибка загрузки файлов");
                    }
                  }
                }}
                rows={1}
              />
            
              {/* Скрепка для загрузки файлов */}
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length > 0) {
                      try {
                        const fd = new FormData();
                        for (const f of files) fd.append("files", f);
                        const r = await fetch("/api/upload", { method: "POST", body: fd });
                        const data = await r.json().catch(() => ({} as any));
                        if (r.ok && data?.ok && Array.isArray(data.files)) {
                          const normalized: UploadedFile[] = data.files.map((f: any) => ({
                            url: f.url,
                            name: f.name ?? "file",
                            type: f.type,
                            size: f.size,
                            isImage: typeof f.isImage === "boolean" ? f.isImage : /^image\//.test(f.type ?? "")
                          }));
                          setAttachments(prev => [...prev, ...normalized]);
                        }
                      } catch (err) {
                        setError("Ошибка загрузки файлов");
                      }
                    }
                  };
                  input.click();
                }}
                className="btn btn-ghost btn-sm absolute right-2 top-1/2 transform -translate-y-1/2"
                title="Прикрепить файлы"
              >
                📎
              </button>
            </div>

            {/* Кнопка отправки */}
            <button
              type="button"
              className="btn btn-primary btn-circle"
              onClick={handleSend}
              disabled={!canSend}
              title="Отправить сообщение"
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "→"
              )}
            </button>
          </div>
        </div>

        {/* Статус и ошибки */}
        <div className="card-actions justify-between items-center p-4 pt-0">
          <div className="text-sm text-base-content/70">
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="loading loading-spinner loading-xs"></span>
                Отправляем…
              </span>
            ) : attachments.length > 0 ? (
              <span className="flex items-center gap-2 text-primary">
                <span>📎</span>
                {attachments.length} файл(ов) прикреплено
              </span>
            ) : (
              "Готово к отправке"
            )}
          </div>
          {error && <div className="alert alert-error alert-sm">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

