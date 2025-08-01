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

  if (req.method === 'GET') {
    const page = parseInt((req.query.page as string) || '1');
    const perPage = parseInt((req.query.perPage as string) || '25');
    const offset = (page - 1) * perPage;
    const totalRow = await db.get('SELECT COUNT(*) as count FROM agents');
    const rows = await db.all('SELECT * FROM agents LIMIT ? OFFSET ?', [perPage, offset]);
    const agents = rows.map(mapAgent);
    const pageCount = Math.ceil(totalRow.count / perPage);
    await db.close();
    return res.status(200).json({ total: totalRow.count, pageCount, agents });
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const id = (req.query.id || req.body.id) as string;
    const { name, short, full, categoryId, displayOnMain } = req.body;
    if (!id) {
      await db.close();
      return res.status(400).json({ message: 'Missing id' });
    }
    const before = await db.get('SELECT * FROM agents WHERE id=?', id);
    if (!before) {
      await db.close();
      return res.status(404).json({ message: 'Agent not found' });
    }
    await db.run(
      `UPDATE agents SET name=?, short_description=?, description=?, category_id=?, display_on_main=? WHERE id=?`,
      [
        name ?? before.name,
        short ?? before.short_description,
        full ?? before.description,
        categoryId ?? before.category_id,
        typeof displayOnMain === 'boolean' ? (displayOnMain ? 1 : 0) : before.display_on_main,
        id,
      ]
    );
    const row = await db.get('SELECT * FROM agents WHERE id=?', id);
    await db.close();
    return res.status(200).json(mapAgent(row));
  }

  return res.status(405).end();
}
