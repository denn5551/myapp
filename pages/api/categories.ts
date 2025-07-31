import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../lib/db';

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
    const hasPage = typeof req.query.page !== 'undefined' || typeof req.query.perPage !== 'undefined';

    if (!hasPage) {
      const rows = await db.all('SELECT id, name FROM agent_categories');
      const all = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        slug: encodeURIComponent(r.name.toLowerCase().replace(/\s+/g, '-')),
      }));
      await db.close();
      return res.status(200).json(all);
    }

    const page = parseInt((req.query.page as string) || '1');
    const perPage = parseInt((req.query.perPage as string) || '5');
    const offset = (page - 1) * perPage;
    const totalRow = await db.get('SELECT COUNT(*) as count FROM agent_categories');
    const catRows = await db.all(
      'SELECT id, name, description FROM agent_categories LIMIT ? OFFSET ?',
      [perPage, offset]
    );
    const categories = await Promise.all(
      catRows.map(async (cat: any) => {
        const agRows = await db.all(
          'SELECT * FROM agents WHERE category_id=? ORDER BY display_on_main DESC LIMIT 4',
          cat.id
        );
        return { ...cat, agents: agRows.map(mapAgent) };
      })
    );
    const pageCount = Math.ceil(totalRow.count / perPage);
    await db.close();
    return res
      .status(200)
      .json({ categories, total: totalRow.count, page, perPage, pageCount });
  }

  if (req.method === 'POST') {
    const { name, description } = req.body;
    if (!name) {
      await db.close();
      return res.status(400).json({ message: 'Missing name' });
    }
    try {
      await db.run('INSERT INTO agent_categories (name, description) VALUES (?, ?)', [name, description || '']);
      const cat = await db.get('SELECT * FROM agent_categories WHERE name=?', name);
      await db.close();
      return res.status(200).json(cat);
    } catch (e: any) {
      await db.close();
      return res.status(500).json({ message: e.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, name, description } = req.body;
    if (!id) {
      await db.close();
      return res.status(400).json({ message: 'Missing id' });
    }
    try {
      await db.run('UPDATE agent_categories SET name=?, description=? WHERE id=?', [name, description, id]);
      const updated = await db.get('SELECT * FROM agent_categories WHERE id=?', id);
      await db.close();
      return res.status(200).json(updated);
    } catch (e: any) {
      await db.close();
      return res.status(500).json({ message: e.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      await db.close();
      return res.status(400).json({ message: 'Missing id' });
    }
    try {
      await db.run('DELETE FROM agent_categories WHERE id=?', id);
      await db.close();
      return res.status(200).json({ success: true });
    } catch (e: any) {
      await db.close();
      return res.status(500).json({ message: e.message });
    }
  }

  await db.close();
  return res.status(405).end();
}
