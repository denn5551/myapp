import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await open({ filename: './data/users.db', driver: sqlite3.Database });

  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(401).json({ message: 'Пользователь не найден', success: false });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Неверный пароль', success: false });

  // Устанавливаем куки для email и user_id
  res.setHeader('Set-Cookie', [
    serialize('email', email, {
      path: '/',
      maxAge: 60 * 60 * 24 * 3, // 3 дня
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }),
    serialize('user_id', String(user.id), {
      path: '/',
      maxAge: 60 * 60 * 24 * 3, // 3 дня
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })
  ]);

  res.json({ 
    message: 'Успешный вход', 
    success: true,
    isAdmin: email === 'kcc-kem@ya.ru'
  });
}
