import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { openDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await openDb();

  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    created_at TEXT
  )`);

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await db.run('INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)',
      [email, hashedPassword, new Date().toISOString()]);
    res.json({ message: 'Регистрация успешна' });
  } catch (e) {
    res.status(400).json({ message: 'Пользователь уже существует' });
  }
}
