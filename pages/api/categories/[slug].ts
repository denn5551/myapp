import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../../lib/db';

function mapAgent(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    short_description: row.short_description,
    full_description: row.description,
    slug: row.slug,
    category_id: row.category_id,
    display_on_main: !!row.display_on_main,
    created_at: row.created_at,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();
  const slug = req.query.slug as string;
  if (req.method !== 'GET' || !slug) {
    await db.close();
    return res.status(405).end();
  }
  const name = decodeURIComponent(slug).replace(/-/g, ' ');
  const category = await db.get('SELECT id, name, description FROM agent_categories WHERE LOWER(name)=LOWER(?)', name);
  if (!category) {
    await db.close();
    return res.status(404).json({ message: 'Category not found' });
  }
  const rows = await db.all('SELECT * FROM agents WHERE category_id=? ORDER BY created_at DESC', category.id);
  const agents = rows.map(mapAgent);
  await db.close();
  return res.status(200).json({ category, agents });
}
