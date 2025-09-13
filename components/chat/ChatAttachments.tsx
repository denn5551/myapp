import React from "react";
import { formatBytes } from "../../utils/mime";

export type UploadedFile = {
  id: string;
  url: string;
  name: string;
  size: number;
  mime: string;
  isImage: boolean;
};

type Props = {
  items: UploadedFile[];
  onRemove: (index: number) => void;
};

const ChatAttachments: React.FC<Props> = ({ items, onRemove }) => {
  if (!items.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((f, idx) => (
        <div
          key={`${f.id}-${idx}`}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
          role="group"
          aria-label={`Вложение ${f.name}`}
        >
          {f.isImage ? (
            <img src={f.url} alt={f.name} className="h-10 w-10 rounded-md object-cover" loading="lazy" style={{width: '250px', height: 'auto'}} />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-md border bg-gray-50 text-xs">FILE</div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-medium" title={f.name}>{f.name}</div>
            <div className="text-xs text-gray-500">{formatBytes(f.size)} • {f.mime}</div>
          </div>
          <button
            className="ml-2 rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
            onClick={() => onRemove(idx)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onRemove(idx); }}
            aria-label={`Удалить вложение ${f.name}`}
            tabIndex={0}
            type="button"
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChatAttachments;