import React, { useCallback, useMemo, useRef, useState } from "react";

export type UploadedFile = {
  url: string;
  name: string;
  type?: string;
  size?: number;
  isImage?: boolean;
};

type Props = {
  /** отдаем наружу финальный список вложений */
  onFilesChange?: (items: UploadedFile[]) => void;
  /** кастомный accept при необходимости */
  accept?: string;
};

const ChatUploader: React.FC<Props> = ({ onFilesChange, accept = "image/*" }) => {
  const [items, setItems] = useState<UploadedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback(
    (next: UploadedFile[]) => {
      setItems(next);
      onFilesChange?.(next);
    },
    [onFilesChange]
  );

  const doUpload = useCallback(async (files: File[]) => {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);

    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f); // ВАЖНО: 'files', не 'files[]'

      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({} as any));

      if (!r.ok || !data?.ok || !Array.isArray(data.files)) {
        throw new Error(data?.error || "Upload failed");
      }

      const normalized: UploadedFile[] = data.files.map((f: any) => ({
        url: f.url,
        name: f.name ?? "file",
        type: f.type,
        size: f.size,
        isImage: typeof f.isImage === "boolean" ? f.isImage : /^image\//.test(f.type ?? "")
      }));

      notify([...items, ...normalized]);
    } catch (e: any) {
      setErr(e?.message || "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }, [items, notify]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files;
    if (!f || !f.length) return;
    void doUpload(Array.from(f));
    // очищаем value, чтобы можно было выбрать тот же файл повторно
    e.currentTarget.value = "";
  }, [doUpload]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files: File[] = [];
      const dt = e.dataTransfer;
      if (dt?.items) {
        for (const it of Array.from(dt.items)) {
          if (it.kind === "file") {
            const f = it.getAsFile();
            if (f) files.push(f);
          }
        }
      } else if (dt?.files) {
        files.push(...Array.from(dt.files));
      }
      void doUpload(files);
    },
    [doUpload]
  );

  const onRemove = useCallback((idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    notify(next);
  }, [items, notify]);

  const hasImages = useMemo(() => items.some(i => i.isImage), [items]);

  return (
    <div className="w-full">
      {/* скрытый файл-инпут */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onInputChange}
      />

      {/* дропзона */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="mt-3 rounded-xl border border-dashed border-gray-300 p-3 text-sm text-gray-600"
      >
        Перетащите файлы сюда или{" "}
        <button
          type="button"
          className="rounded bg-gray-100 px-2 py-1 hover:bg-gray-200"
          onClick={() => inputRef.current?.click()}
        >
          Выберите файлы
        </button>
      </div>

      {/* превью */}
      {items.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((f, i) => (
            <div key={`${f.url}-${i}`} className="relative rounded-lg border p-2">
              {f.isImage ? (
                <img
                  src={f.url}
                  alt={f.name}
                  className="h-auto w-[150px] object-cover rounded-md"  // фикс-ширина превью
                />
              ) : (
                <div className="w-[150px] h-[90px] flex items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500">
                  {f.name}
                </div>
              )}

              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white"
                onClick={() => onRemove(i)}
                aria-label="Удалить файл"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-500">Нет вложений</div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {busy ? "Загружаем…" : "Готово к отправке"}
      </div>
      {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
    </div>
  );
};

export default ChatUploader;
