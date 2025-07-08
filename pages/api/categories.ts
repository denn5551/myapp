import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const db = await openDb();
  const categories = await db.all('SELECT id, name, description FROM agent_categories');
  await db.close();
  res.status(200).json(categories);
}
