import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

type UploadedFile = {
  url: string;
  name: string;
  type?: string;
  size?: number;
  isImage?: boolean;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const form = formidable({ multiples: true, uploadDir, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ ok: false, error: "Parse error" });
    }
    const arr: formidable.File[] = [];
    const raw = files.files;
    if (Array.isArray(raw)) arr.push(...raw);
    else if (raw) arr.push(raw as formidable.File);

    const out: UploadedFile[] = [];
    for (const f of arr) {
      // файл уже сохранён formidable в uploadDir
      const rel = path.relative(path.join(process.cwd(), "public"), f.filepath);
      const url = "/" + rel.replace(/\\/g, "/");
      const isImage = /^image\//.test(f.mimetype || "");

      out.push({
        url,
        name: f.originalFilename || path.basename(f.filepath),
        type: f.mimetype || undefined,
        size: f.size,
        isImage,
      });
    }

    return res.json({ ok: true, files: out });
  });
};

export default handler;

