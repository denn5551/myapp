import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const db = await openDb();
  const users = await db.all('SELECT id, email, created_at FROM users');
  await db.close();
  res.status(200).json(users);
}
