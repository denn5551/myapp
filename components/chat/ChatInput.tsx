import React, { useState } from "react";
import ChatUploader from "./ChatUploader";
import { UploadedFile } from "./ChatAttachments";

type Props = {
  threadId?: string;
  assistantId?: string;
  onMessageSent?: (ok: boolean, threadId?: string, response?: string, userMessage?: string, parts?: any[]) => void;
};

const ChatInput: React.FC<Props> = ({ threadId, assistantId, onMessageSent }) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAttachmentsChange = (items: UploadedFile[]) => setAttachments(items);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") void handleSend();
  };
  
 
const doUpload = async (files: File[]) => {
  if (!files.length) return;
  setError(null);
  setBusy(true);
  try {
    const formData = new FormData();
    files.forEach((f) => formData.append("files[]", f));
    const r = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await r.json();
    if (!r.ok || !data.ok) throw new Error(data?.error || "Upload failed");
    const next = [...attachments, ...data.files];
    setAttachments(next);
  } catch (e: any) {
    setError(e?.message || "Ошибка загрузки");
  } finally {
    setBusy(false);
  }
};

const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  console.log('Paste event triggered');
  const items = e.clipboardData?.items;
  console.log('Clipboard items:', items?.length || 0);
  
  if (!items?.length) return;
  
  const files: File[] = [];
  for (const item of items as any) {
    console.log('Item kind:', item.kind, 'type:', item.type);
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) {
        console.log('Found file:', file.name, file.type, file.size);
        files.push(file);
      }
    }
  }
  
  console.log('Files to upload:', files.length);
  if (files.length) {
    e.preventDefault();
    console.log('Starting upload...');
    await doUpload(files);
  }
};

  const handleSend = async () => {
    setError(null);
    const hasText = text.trim().length > 0;
    const hasFiles = attachments.length > 0;
    if (!hasText && !hasFiles) return;

    let textContent = hasText ? text.trim() : "";
    const parts: any[] = [{ type: "text", text: textContent }];

    for (const f of attachments) {
      // Use explicit public base URL if provided; sanitize (no trailing slash)
      const baseRaw = (process.env.NEXT_PUBLIC_BASE_URL as string) || (typeof window !== 'undefined' ? window.location.origin : '');
      const publicBase = (baseRaw || '').replace(/\/$/, '');
      if (f.isImage) {
        let url = (f.url || '').trim();
        // Next serves files from /public at root (no /public prefix)
        url = url.replace(/^\/public\//, '/');
        const absUrl = /^https?:\/\//i.test(url)
          ? url
          : (url.startsWith('/') ? `${publicBase}${url}` : `${publicBase}/${url}`);
        const isValidUrl = /^https?:\/\//i.test(absUrl);
        if (!isValidUrl) {
          console.warn('Skip image with invalid URL:', url, f);
        } else {
          parts.push({ type: "image_url", image_url: { url: absUrl } });
        }
      } else {
        let url = (f.url || '').trim();
        url = url.replace(/^\/public\//, '/');
        const absUrl = /^https?:\/\//i.test(url)
          ? url
          : (url.startsWith('/') ? `${publicBase}${url}` : `${publicBase}/${url}`);
        parts[0].text += `\n[Файл: ${f.name}] ${absUrl}`;
      }
    }

    setBusy(true);
    try {
      const requestBody: any = { messages: [{ role: "user", content: parts }] };
      
      // Use assistant API if assistantId is provided
      if (assistantId) {
        requestBody.assistant_id = assistantId;
        if (threadId) requestBody.thread_id = threadId;
      }

      const r = await fetch(`/api/chat/${encodeURIComponent(assistantId || threadId || 'default')}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await r.json();
      console.log('ChatInput API Response:', data);
      if (!r.ok || !data.ok) throw new Error(data?.error?.message || "Ошибка отправки");
      // Log sent image URLs for verification
      try {
        const imageUrls = parts
          .filter((p: any) => p && p.type === "image_url" && p.image_url?.url)
          .map((p: any) => p.image_url.url);
        if (imageUrls.length) {
          console.log("Sent image URLs:", imageUrls);
        }
      } catch {}
      setText("");
      setAttachments([]);
      onMessageSent?.(true, data.thread_id, data.message?.content, text, parts);
    } catch (e: any) {
      setError(e?.message || "Не удалось отправить сообщение");
      onMessageSent?.(false);
    } finally {
      setBusy(false);
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

      <div className="mt-3">
        <ChatUploader onAttachmentsChange={handleAttachmentsChange} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-gray-500">{busy ? "Отправляем…" : "Готово к отправке"}</div>
        <button
          type="button"
          className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90 focus:outline-none"
          onClick={handleSend}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") void handleSend(); }}
          aria-label="Отправить сообщение"
          tabIndex={0}
          disabled={busy}
        >
          Отправить
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
};

export default ChatInput;
