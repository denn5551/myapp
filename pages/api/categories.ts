//pages/api/categories.ts

import Database from 'better-sqlite3';
import { parse } from 'cookie';

export default function handler(req, res) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (cookies.userEmail !== 'kcc-kem@ya.ru') {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const db = new Database('./data/users.db');

  // Получить категории
  if (req.method === 'GET') {
    const { limit, offset = 0, name } = req.query as any;

    if (name) {
      const category = db
        .prepare('SELECT * FROM agent_categories WHERE name = ?')
        .get(name);
      return res.status(200).json({ category });
    }

    let query = 'SELECT * FROM agent_categories';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));
    }

    const categories = db.prepare(query).all(...params);
    return res.status(200).json({ categories });
  }

  // Добавить новую категорию
  if (req.method === 'POST') {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Поле name обязательно' });

    try {
      const stmt = db.prepare(
        'INSERT INTO agent_categories (name, description) VALUES (?, ?)'
      );
      const info = stmt.run(name, description || '');
      const newCategory = db
        .prepare('SELECT * FROM agent_categories WHERE id = ?')
        .get(info.lastInsertRowid);
      return res.status(201).json({ category: newCategory });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Изменить категорию (PATCH/PUT)
  if (req.method === 'PATCH' || req.method === 'PUT') {
    const { id, name, description } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    try {
      db.prepare(
        'UPDATE agent_categories SET name = ?, description = ? WHERE id = ?'
      ).run(name, description, id);
      const updated = db
        .prepare('SELECT * FROM agent_categories WHERE id = ?')
        .get(id);
      return res.status(200).json({ category: updated });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Удалить категорию
  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id обязателен' });
    try {
      db.prepare('DELETE FROM agent_categories WHERE id = ?').run(id);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).json({ error: 'Метод не разрешён' });
}

