//pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { parse } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (cookies.userEmail !== 'kcc-kem@ya.ru') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'GET') return res.status(405).end();

  const db = await open({ filename: './data/users.db', driver: sqlite3.Database });

  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    created_at TEXT
  )`);

  const rows = await db.all('SELECT id, email, created_at FROM users ORDER BY id ASC');
  const now = new Date();
  const users = rows.map(u => {
    const diff = Math.floor((now.getTime() - new Date(u.created_at).getTime()) / (1000*60*60*24));
    const status: 'trial' | 'expired' = diff < 3 ? 'trial' : 'expired';
    const endDate = new Date(new Date(u.created_at).getTime() + 3*24*60*60*1000).toISOString().split('T')[0];
    return {
      id: u.id,
      email: u.email,
      registeredAt: u.created_at.split('T')[0],
      subscriptionStatus: status,
      subscriptionStart: u.created_at.split('T')[0],
      subscriptionEnd: endDate,
    };
  });
	console.log("⚠️ Загруженные пользователи из БД:", users);
  res.status(200).json({ users });
}
