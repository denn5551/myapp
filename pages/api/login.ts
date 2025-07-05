import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { serialize } from 'cookie';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await open({ filename: './data/users.db', driver: sqlite3.Database });

  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(401).json({ message: 'Пользователь не найден', success: false });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Неверный пароль', success: false });

  // Устанавливаем куки с правильными параметрами
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none' as const,
    domain: req.headers.host?.split(':')[0],
    maxAge: 60 * 60 * 24 * 3 // 3 дня
  };

  const token = crypto.randomBytes(16).toString('hex');

  res.setHeader('Set-Cookie', [
    serialize('email', email, cookieOptions),
    serialize('user_id', String(user.id), cookieOptions),
    serialize('token', token, cookieOptions)
  ]);

  console.log('Login response headers:', res.getHeaders());

  await db.close();

  res.json({ 
    message: 'Успешный вход', 
    success: true,
    isAdmin: email === 'kcc-kem@ya.ru'
  });
}
