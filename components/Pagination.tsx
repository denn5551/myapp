import React from 'react';

interface Props {
  page: number;
  pageCount: number;
  perPage: number;
  perPageOptions?: number[];
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;
}

export default function Pagination({
  page,
  pageCount,
  perPage,
  perPageOptions = [5, 10, 15, 25],
  onPageChange,
  onPerPageChange,
}: Props) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <label>
        Показывать по{' '}
        <select
          className="border px-2 py-1 rounded"
          value={perPage}
          onChange={(e) => onPerPageChange(+e.target.value)}
        >
          {perPageOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        className="px-2 py-1 border rounded"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>
      <span>
        Страница {page} из {pageCount}
      </span>
      <button
        className="px-2 py-1 border rounded"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
}
