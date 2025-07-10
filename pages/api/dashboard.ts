import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../lib/db';

function mapAgent(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    short_description: row.short_description,
    full_description: row.description,
    category_id: row.category_id,
    display_on_main: !!row.display_on_main,
    created_at: row.created_at,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();
  if (req.method !== 'GET') {
    await db.close();
    return res.status(405).end();
  }
  const rows = await db.all('SELECT * FROM agents WHERE display_on_main = 1');
  const agents = rows.map(mapAgent);
  await db.close();
  return res.status(200).json({ agents });
}
