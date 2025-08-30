import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import { readFile } from "fs/promises";
import { uploadBuffer } from "../../lib/storage";
import { openDb } from "../../lib/db";
import { randomUUID } from "crypto";

export const config = { api: { bodyParser: false } };

type ApiFile = { id: string; url: string; name: string; size: number; mime: string; isImage: boolean };
type Ok = { ok: true; files: ApiFile[] };
type Err = { ok: false; error: string };

const MAX_FILES = Number(process.env.UPLOAD_MAX_FILES ?? 5);
const MAX_FILE_MB = Number(process.env.UPLOAD_MAX_FILE_MB ?? 20);
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ["image/", "text/"];
const ALLOWED_MIME_EXACT = new Set([
  "application/pdf",
  "application/zip",
  "application/json",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const isAllowedMime = (mime: string) =>
  ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p)) || ALLOWED_MIME_EXACT.has(mime);

const parseForm = (req: NextApiRequest) =>
  new Promise<{ files: FormidableFile[] }>((resolve, reject) => {
    const form = formidable({
      multiples: true,
      maxFileSize: MAX_FILE_BYTES,
      allowEmptyFiles: false,
      filter: ({ mimetype }) => !!mimetype,
    });
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const listRaw = files.files;
      const list = Array.isArray(listRaw) ? listRaw : listRaw ? [listRaw] : [];
      resolve({ files: list as FormidableFile[] });
    });
  });

const handler = async (req: NextApiRequest, res: NextApiResponse<Ok | Err>) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { files } = await parseForm(req);
    if (!files.length) return res.status(400).json({ ok: false, error: "No files received" });
    if (files.length > MAX_FILES) return res.status(400).json({ ok: false, error: `Too many files. Max: ${MAX_FILES}` });

    const results: ApiFile[] = [];
    const db = await openDb();

    for (const f of files) {
      const size = f.size ?? 0;
      const mime = f.mimetype ?? "application/octet-stream";
      if (size <= 0) return res.status(400).json({ ok: false, error: "Empty file" });
      if (size > MAX_FILE_BYTES) return res.status(400).json({ ok: false, error: `File too large. Max ${MAX_FILE_MB} MB` });
      if (!isAllowedMime(mime)) return res.status(415).json({ ok: false, error: `Unsupported type: ${mime}` });

      const buf = await readFile(f.filepath);
      const stored = await uploadBuffer(buf, f.originalFilename || "file", mime);

      const id = randomUUID();
      await db.run(
        `INSERT INTO upload_assets (id, url, name, size, mime, is_image, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        id, stored.url, stored.name, stored.size, stored.mime, stored.isImage ? 1 : 0
      );

      results.push({ 
        id, 
        url: stored.url, 
        name: stored.name, 
        size: stored.size, 
        mime: stored.mime, 
        isImage: stored.isImage 
      });
    }

    return res.status(200).json({ ok: true, files: results });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Upload failed" });
  }
};

export default handler;
