import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Открываем соединение с базой данных
async function openDb() {
  return open({
    filename: './data/database.sqlite',
    driver: sqlite3.Database
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();

  if (req.method === 'GET') {
    try {
      const users = await db.all('SELECT id, email, created_at FROM users');
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  } 
  else if (req.method === 'POST') {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      const result = await db.run(
        'INSERT INTO users (email, password, created_at) VALUES (?, ?, datetime("now"))',
        [email, password]
      );
      
      const newUser = await db.get(
        'SELECT id, email, created_at FROM users WHERE id = ?',
        result.lastID
      );
      
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
  else if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      await db.run('DELETE FROM users WHERE id = ?', id);
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 