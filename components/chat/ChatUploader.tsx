import React, { useCallback, useRef, useState } from "react";
import ChatAttachments, { UploadedFile } from "./ChatAttachments";

type Props = {
  onAttachmentsChange: (items: UploadedFile[]) => void;
  maxFiles?: number;
  accept?: string;
};

const DEFAULT_ACCEPT = "image/*,.pdf,.txt,.csv,.json,.zip,.doc,.docx";

const ChatUploader: React.FC<Props> = ({
  onAttachmentsChange,
  maxFiles = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_FILES ?? 5),
  accept = DEFAULT_ACCEPT,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const notify = (next: UploadedFile[]) => {
    setItems(next);
    onAttachmentsChange(next);
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    notify(next);
  };

  const handleOpenPicker = () => inputRef.current?.click();

  const doUpload = async (files: File[]) => {
    if (!files.length) return;
    setError(null);
    setBusy(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      const r = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data?.error || "Upload failed");
      const next = [...items, ...data.files];
      notify(next);
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  };

  const takeFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remain = Math.max(0, maxFiles - items.length);
    await doUpload(Array.from(fileList).slice(0, remain));
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await takeFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    await takeFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items?.length) return;
    const files: File[] = [];
    for (const it of items as any) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) await doUpload(files);
  }, [items]);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Загрузить файлы: кликните, перетащите или вставьте скриншот"
        onClick={handleOpenPicker}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpenPicker(); }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        className={`flex w-full items-center justify-between rounded-xl border p-3 text-sm outline-none transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"}`}
      >
        <span className="truncate">
          Перетащите файлы или <span className="underline">выберите</span>. Вставка скриншота — Ctrl/Cmd+V.
        </span>
        <span className="text-xs text-gray-500">{items.length} влож.</span>
      </div>

      <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={handleInputChange} />
      {busy && <div className="mt-2 text-xs text-gray-500">Загружаем…</div>}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
      <ChatAttachments items={items} onRemove={handleRemove} />
    </div>
  );
};

export default ChatUploader;
