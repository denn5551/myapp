//pages/api/me.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const userId = cookies.user;

  if (!userId) return res.status(401).json({});

  const db = await open({ filename: './data/users.db', driver: sqlite3.Database });

  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    created_at TEXT
  )`);

  const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
  if (!user) return res.status(401).json({});

  const hasPaid = cookies.subscriptionPaid === 'true';
  const now = new Date();
  const registered = new Date(user.created_at);
  const diffInDays = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'trial' | 'active' | 'expired' = 'expired';
  if (hasPaid) status = 'active';
  else if (diffInDays < 3) status = 'trial';

  res.status(200).json({
    email: user.email,
    registeredAt: user.created_at,
    subscriptionStatus: status,
    trialEndsIn: 3 - diffInDays,
  });
}
