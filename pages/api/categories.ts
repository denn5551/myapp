import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: './data/users.db',
    driver: sqlite3.Database,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db;
  try {
    db = await openDb();

    if (req.method === 'GET') {
      const categories = await db.all('SELECT id, name FROM agent_categories');
      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'name required' });
      const result = await db.run('INSERT INTO agent_categories (name) VALUES (?)', name);
      const category = await db.get('SELECT id, name FROM agent_categories WHERE id = ?', result.lastID);
      return res.status(201).json(category);
    }

    if (req.method === 'PUT') {
      const { id, name } = req.body;
      if (!id || !name) return res.status(400).json({ error: 'id and name required' });
      await db.run('UPDATE agent_categories SET name = ? WHERE id = ?', name, id);
      const category = await db.get('SELECT id, name FROM agent_categories WHERE id = ?', id);
      return res.status(200).json(category);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.run('DELETE FROM agent_categories WHERE id = ?', id);
      return res.status(200).json({ message: 'deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    if (db) await db.close();
  }
}
