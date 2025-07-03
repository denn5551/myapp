import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Открываем соединение с базой данных
async function openDb() {
  return open({
    filename: './data/users.db',
    driver: sqlite3.Database
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let db;
  try {
    db = await openDb();

    if (req.method === 'GET') {
      // Добавляем проверку существования таблицы
      const tableExists = await db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
      if (!tableExists) {
        console.error('Table users does not exist');
        return res.status(500).json({ error: 'Database table not found' });
      }

      const users = await db.all(`
        SELECT id, email, name, created_at, 
               is_active, subscription_status 
        FROM users
      `);
      console.log('Fetched users:', users); // Для отладки
      res.status(200).json(users);
    } 
    else if (req.method === 'POST') {
      const { email, password, name } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      try {
        const result = await db.run(`
          INSERT INTO users (
            email, 
            password_hash, 
            name, 
            created_at,
            is_active,
            subscription_status
          ) VALUES (?, ?, ?, datetime('now'), true, 'trial')
        `, [email, password, name || null]);
        
        const newUser = await db.get(`
          SELECT id, email, name, created_at, 
                 is_active, subscription_status 
          FROM users 
          WHERE id = ?
        `, result.lastID);
        
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