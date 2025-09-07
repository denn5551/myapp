import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs/promises'
import path from 'path'
import openDb from '@/lib/db'
import { isImageMime, normalizeMime } from '@/utils/mime'
import { saveLocalFile } from '@/lib/storage'

export const config = { api: { bodyParser: false } }

type ApiFile = { id: string; url: string; name: string; size: number; mime: string; isImage: boolean };
type Ok = { ok: true; files: ApiFile[] };
type Err = { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const maxMb = Number(process.env.UPLOAD_MAX_FILE_MB || 20);
  const maxFiles = Number(process.env.UPLOAD_MAX_FILES || 5);
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');

  await fs.mkdir(uploadDir, { recursive: true });

  const form = formidable({
    multiples: true,
    maxFileSize: maxMb * 1024 * 1024,
    uploadDir,
    filename: (name, ext, part, form) => `${Date.now()}_${part.originalFilename}`
  });

  try {
    const [fields, files] = await form.parse(req);
    const list = Array.isArray(files['files[]']) ? files['files[]'] : files.files;
    const arr = (Array.isArray(list) ? list : list ? [list] : []).slice(0, maxFiles);

    if (arr.length === 0) {
      return res.status(400).json({ ok: false, error: 'No files received' });
    }

    if (arr.length > maxFiles) {
      return res.status(400).json({ ok: false, error: `Too many files. Max: ${maxFiles}` });
    }

    const db = await openDb();
    const out: ApiFile[] = [];

    for (const f of arr) {
      const mime = normalizeMime(f.mimetype || 'application/octet-stream');
      const size = f.size || 0;
      const name = f.originalFilename || 'file';

      if (size <= 0) {
        return res.status(400).json({ ok: false, error: 'Empty file' });
      }

      if (size > maxMb * 1024 * 1024) {
        return res.status(400).json({ ok: false, error: `File too large. Max ${maxMb} MB` });
      }

      const saved = await saveLocalFile(f.filepath, name);
      const url = saved.url;

      const id = crypto.randomUUID();
      const isImg = isImageMime(mime) ? 1 : 0;

      await db.run(
        `INSERT INTO UploadAsset (id,url,name,size,mime,isImage) VALUES (?,?,?,?,?,?)`,
        id, url, name, size, mime, isImg
      );

      out.push({ id, url, name, size, mime, isImage: !!isImg });
    }

    return res.status(200).json({ ok: true, files: out });
  } catch (e: any) {
    console.error('Upload error:', e);
    return res.status(500).json({ ok: false, error: 'upload_failed' });
  }
}