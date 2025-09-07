import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import openDb from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();
  if (req.method === 'GET') {
    const users = await db.all(
      `SELECT id, email, created_at, status as subscriptionStatus,
              subscription_start as subscriptionStart,
              subscription_end as subscriptionEnd
       FROM users`
    );
    await db.close();
    return res.status(200).json(users);
  }
  if (req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) {
      await db.close();
      return res.status(400).json({ message: 'email and password required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 7);
    trialEnd.setHours(23, 59, 59, 999);
    try {
      await db.run(
        `INSERT INTO users (email, password, status, subscription_start, subscription_end, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [email, hashedPassword, 'trial', now.toISOString(), trialEnd.toISOString(), now.toISOString()]
      );
      const user = await db.get(
        `SELECT id, email, created_at, status as subscriptionStatus,
                subscription_start as subscriptionStart,
                subscription_end as subscriptionEnd
         FROM users WHERE email = ?`,
        email
      );
      await db.close();
      return res.status(201).json(user);
    } catch (e) {
      await db.close();
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
  }
  await db.close();
  res.status(405).end();
}
