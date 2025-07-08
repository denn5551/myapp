import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();

  if (req.method === 'GET') {
    if (req.query.id) {
      const agent = await db.get('SELECT * FROM agents WHERE id = ?', req.query.id);
      await db.close();
      return res.status(200).json(agent);
    }
    const agents = await db.all('SELECT * FROM agents');
    await db.close();
    return res.status(200).json(agents);
  }

  if (req.method === 'POST') {
    const { id, name, short, full, categoryId, slug, isActive } = req.body;
    if (!id || !name || !categoryId) {
      await db.close();
      return res.status(400).json({ message: 'Missing fields' });
    }
    try {
      await db.run(
        `INSERT INTO agents (id, name, description, short_description, category_id, slug, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          id,
          name,
          full || '',
          short || '',
          categoryId,
          slug || id,
          isActive ? 1 : 0,
        ]
      );
      const newAgent = await db.get('SELECT * FROM agents WHERE id = ?', id);
      await db.close();
      return res.status(200).json(newAgent);
    } catch (e: any) {
      await db.close();
      return res.status(500).json({ message: e.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, name, short, full, categoryId, slug, isActive } = req.body;
    if (!id) {
      await db.close();
      return res.status(400).json({ message: 'Missing id' });
    }
    try {
      await db.run(
        `UPDATE agents SET name=?, description=?, short_description=?, category_id=?, slug=?, is_active=? WHERE id=?`,
        [name, full, short, categoryId, slug || id, isActive ? 1 : 0, id]
      );
      const updated = await db.get('SELECT * FROM agents WHERE id=?', id);
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
      await db.run('DELETE FROM agents WHERE id=?', id);
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
