import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { openDb } from '../../lib/db';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await openDb();

  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) return res.status(401).json({ message: 'Пользователь не найден', success: false });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Неверный пароль', success: false });

  // Устанавливаем только одну куку email, httpOnly: false чтобы клиент мог читать
  const cookieOptions = {
    path: '/',
    httpOnly: false, // чтобы клиент мог читать email
    secure: false, // отключаем для http
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 3 // 3 дня
  };

  console.log('Set-Cookie:', serialize('email', email, cookieOptions));

  res.setHeader('Set-Cookie', serialize('email', email, cookieOptions));

  await db.close();

  res.json({ 
    message: 'Успешный вход', 
    success: true,
    isAdmin: email === 'kcc-kem@ya.ru'
  });
}
