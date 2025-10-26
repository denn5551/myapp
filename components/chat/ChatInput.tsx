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
      <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Миниатюры изображений */}
        {attachments.length > 0 && (
          <div className="border-b border-gray-100 p-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={`${file.url}-${index}`} className="relative group">
                  {file.isImage ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-500">📄</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Основное поле ввода */}
        <div className="flex items-end p-4 gap-3">
          <div className="flex-1 relative">
            <textarea
              className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-white p-4 pr-14 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 min-h-[52px] max-h-[140px] text-gray-800 placeholder-gray-400 shadow-sm transition-all duration-200 hover:border-gray-300"
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
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all duration-200 text-lg"
              title="Прикрепить файлы"
            >
              📎
            </button>
          </div>

          {/* Кнопка отправки */}
          <button
            type="button"
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            onClick={handleSend}
            disabled={!canSend}
            title="Отправить сообщение"
          >
            {busy ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-lg font-bold">→</span>
            )}
          </button>
        </div>

        {/* Статус и ошибки */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 font-medium">
            {busy ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Отправляем…
              </span>
            ) : attachments.length > 0 ? (
              <span className="flex items-center gap-2 text-blue-600">
                <span>📎</span>
                {attachments.length} файл(ов) прикреплено
              </span>
            ) : (
              "Готово к отправке"
            )}
          </div>
          {error && <div className="text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-lg">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

