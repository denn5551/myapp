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

  // Гарантируем существование каталога
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
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
    const filename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
    const finalPath = path.join(uploadDir, filename);
    
    // Копируем файл
    await fs.promises.copyFile(file.filepath, finalPath);
    await fs.promises.unlink(file.filepath);
    
    // Проверяем, что файл действительно сохранен
    if (!fs.existsSync(finalPath)) {
      console.error('File not saved after copy:', finalPath);
      return res.status(500).json({ error: 'save_failed' });
    }
    
    // Формируем абсолютный URL
    const base = process.env.PUBLIC_BASE_URL || `http://${req.headers.host}`;
    const url = `${base}/uploads/${filename}`;
    
    console.log('UPLOAD SUCCESS', { finalPath, url, size: fs.statSync(finalPath).size });
    return res.status(200).json({ url });
    
  } catch (err: any) {
    console.error('UPLOAD ERROR:', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    
    if (err.code === 'ENOSPC') {
      return res.status(500).json({ error: 'Storage full' });
    }
    
    return res.status(500).json({ error: 'Upload failed' });
  }
}
