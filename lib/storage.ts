import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export type StoredFile = {
  url: string;
  name: string;
  size: number;
  mime: string;
  isImage: boolean;
};

const STORAGE_DRIVER = process.env.STORAGE_DRIVER?.toLowerCase() === "s3" ? "s3" : "local";
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET ?? "";
const AWS_S3_REGION = process.env.AWS_S3_REGION ?? "";
const S3_PUBLIC_BASE =
  process.env.S3_PUBLIC_BASE ??
  (AWS_S3_BUCKET && AWS_S3_REGION
    ? `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com`
    : "");

const s3 =
  STORAGE_DRIVER === "s3"
    ? new S3Client({
        region: AWS_S3_REGION,
        credentials:
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              }
            : undefined,
      })
    : null;

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

  if (STORAGE_DRIVER === "s3") {
    if (!s3 || !AWS_S3_BUCKET || !S3_PUBLIC_BASE) {
      throw new Error("S3 storage is not configured properly.");
    }
    const key = `uploads/${yyyy}/${mm}/${randomUUID()}-${base}${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mime,
        ACL: "public-read",
      })
    );
    return { url: `${S3_PUBLIC_BASE}/${key}`, name: `${base}${ext}`, size: buffer.length, mime, isImage };
  }

  const localRel = path.join("uploads", yyyy, mm);
  const localDir = path.join(process.cwd(), "public", localRel);
  await ensureDir(localDir);
  const filename = `${randomUUID()}-${base}${ext}`;
  const fullPath = path.join(localDir, filename);
  await fs.writeFile(fullPath, buffer);
  return { url: `/${localRel.replace(/\\/g, "/")}/${filename}`, name: `${base}${ext}`, size: buffer.length, mime, isImage };
};
