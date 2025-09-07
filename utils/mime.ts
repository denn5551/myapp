export const isImageMime = (mime: string): boolean => mime.startsWith("image/");

export const normalizeMime = (mime: string): string => {
  if (!mime || typeof mime !== 'string') return 'application/octet-stream';
  return mime.toLowerCase().trim();
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};