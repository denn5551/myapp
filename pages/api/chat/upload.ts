import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    maxFileSize: 5 * 1024 * 1024,
    filter: ({ mimetype }) => {
      return Boolean(mimetype && allowedTypes.includes(mimetype));
    },
    multiples: false,
  });

  try {
    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const ext = path.extname(file.originalFilename || '').toLowerCase();
    const filename = `${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.promises.rename(file.filepath, filepath);
    return res.status(200).json({ url: `/uploads/${filename}` });
  } catch (err: any) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    return res.status(400).json({ error: err.message || 'Upload error' });
  }
}
