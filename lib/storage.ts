import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export type StoredFile = {
  url: string;
  filepath: string;
  name: string;
  size: number;
  mime: string;
  isImage: boolean;
};

const STORAGE_DRIVER = process.env.STORAGE_DRIVER?.toLowerCase() === "s3" ? "s3" : "local";

const ensureDir = async (p: string) => fs.mkdir(p, { recursive: true });

const sanitizeBase = (name: string) =>
  (name.replace(/\.[^/.]+$/, "") || "file")
    .toLowerCase()
    .replace(/[^a-z0-9\-_.]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const getExt = (name: string, fallback = "") => {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? `.${m[1].toLowerCase()}` : fallback;
};

export const saveLocalFile = async (
  tmpPath: string,
  originalName: string
): Promise<{ url: string; filepath: string }> => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const base = sanitizeBase(originalName || "file");
  const ext = getExt(originalName, "");
  
  const localRel = path.join("uploads", yyyy, mm);
  const localDir = path.join(process.cwd(), "public", localRel);
  await ensureDir(localDir);
  
  const filename = `${Date.now()}_${randomUUID()}-${base}${ext}`;
  const fullPath = path.join(localDir, filename);
  
  // Move file from temp to final location
  await fs.rename(tmpPath, fullPath);
  
  return { 
    url: `/${localRel.replace(/\\/g, "/")}/${filename}`, 
    filepath: fullPath 
  };
};

export const uploadBuffer = async (
  buffer: Buffer,
  originalName: string,
  mime: string
): Promise<StoredFile> => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const base = sanitizeBase(originalName || "file");
  const ext = getExt(originalName, mime.startsWith("image/") ? ".png" : "");
  const isImage = mime.startsWith("image/");

  const localRel = path.join("uploads", yyyy, mm);
  const localDir = path.join(process.cwd(), "public", localRel);
  await ensureDir(localDir);
  const filename = `${Date.now()}_${randomUUID()}-${base}${ext}`;
  const fullPath = path.join(localDir, filename);
  await fs.writeFile(fullPath, buffer);
  
  return { 
    url: `/${localRel.replace(/\\/g, "/")}/${filename}`, 
    filepath: fullPath,
    name: `${base}${ext}`, 
    size: buffer.length, 
    mime, 
    isImage 
  };
};