import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { openDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, password } = req.body;
  const db = await openDb();

  const hashedPassword = await bcrypt.hash(password, 10);
  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 7);
  trialEnd.setHours(23, 59, 59, 999);
  try {
    await db.run(
      'INSERT INTO users (email, password, status, subscription_start, subscription_end, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, 'trial', now.toISOString(), trialEnd.toISOString(), now.toISOString()]
    );
    res.json({ message: 'Регистрация успешна' });
  } catch (e) {
    res.status(400).json({ message: 'Пользователь уже существует' });
  }
}
