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
      const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='agents'");
      if (!tableExists) {
        return res.status(500).json({ error: 'Database table not found' });
      }

      const agents = await db.all(`
        SELECT id, name, description, category_id, created_at, is_active, slug, short_description
        FROM agents
      `);
      res.status(200).json(agents);
    } else if (req.method === 'POST') {
      const { openaiId, name, short, full, categoryId, slug } = req.body;
      if (!openaiId || !name || !categoryId) {
        return res.status(400).json({ error: 'openaiId, name and categoryId are required' });
      }

      const createdAt = new Date().toISOString();
      await db.run(
        `INSERT INTO agents (id, name, description, category_id, created_at, is_active, slug, short_description)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [openaiId, name, full || null, categoryId, createdAt, slug || name.toLowerCase().replace(/\s+/g, '-'), short || null]
      );

      const newAgent = await db.get(
        `SELECT id, name, description, category_id, created_at, is_active, slug, short_description
         FROM agents WHERE id = ?`,
        openaiId
      );
      res.status(201).json(newAgent);
    } else if (req.method === 'PUT') {
      const { id, name, short, full, categoryId, slug } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }
      await db.run(
        `UPDATE agents SET
           name = ?,
           description = ?,
           category_id = ?,
           slug = ?,
           short_description = ?
         WHERE id = ?`,
        [name, full || null, categoryId, slug || name?.toLowerCase().replace(/\s+/g, '-'), short || null, id]
      );
      const updated = await db.get(
        `SELECT id, name, description, category_id, created_at, is_active, slug, short_description
         FROM agents WHERE id = ?`,
        id
      );
      res.status(200).json(updated);
    } else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'id required' });
      await db.run('DELETE FROM agents WHERE id = ?', id);
      res.status(200).json({ message: 'deleted' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    if (db) await db.close();
  }
}
