import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();

  if (req.method === 'GET') {
    const categories = await db.all('SELECT id, name, description FROM agent_categories');
    await db.close();
    return res.status(200).json(categories);
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
