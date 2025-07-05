import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

// Открываем соединение с базой данных
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
      // Проверяем наличие таблицы и нужных колонок
      const columns = await db.all("PRAGMA table_info(users)");
      const columnNames = columns.map(c => c.name);
      if (!columnNames.includes('id') || !columnNames.includes('email') || !columnNames.includes('created_at')) {
        console.error('Required columns are missing in users table');
        return res.status(500).json({ error: 'Invalid users table schema' });
      }

      const hasName = columnNames.includes('name');
      const query = hasName
        ? 'SELECT id, email, name, created_at FROM users'
        : 'SELECT id, email, created_at FROM users';
      const rows = await db.all(query);
      const users = hasName ? rows : rows.map(r => ({ ...r, name: null }));

      res.status(200).json(users);
    } 
    else if (req.method === 'POST') {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        const columns = await db.all("PRAGMA table_info(users)");
        const columnNames = columns.map(c => c.name);
        const hasName = columnNames.includes('name');

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertQuery = hasName
          ? 'INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, ?)'
          : 'INSERT INTO users (email, password, created_at) VALUES (?, ?, ?)';
        const params = hasName
          ? [email, hashedPassword, name || null, new Date().toISOString()]
          : [email, hashedPassword, new Date().toISOString()];

        const result = await db.run(insertQuery, params);

        const selectQuery = hasName
          ? 'SELECT id, email, name, created_at FROM users WHERE id = ?'
          : 'SELECT id, email, created_at FROM users WHERE id = ?';
        const newUser: any = await db.get(selectQuery, result.lastID);
        if (!hasName) {
          newUser.name = null;
        }

        res.status(201).json(newUser);
      } catch (error: any) {
        console.error('Insert error:', error);
        if (error.message?.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        throw error;
      }
    }
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await db.run('DELETE FROM users WHERE id = ?', id);
      res.status(200).json({ message: 'User deleted successfully' });
    }
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    if (db) {
      await db.close();
    }
  }
} 