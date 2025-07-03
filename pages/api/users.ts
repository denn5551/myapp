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
  else if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    try {
      await db.run(`
        UPDATE users 
        SET 
          subscription_status = ?,
          subscription_end = ?
        WHERE id = ?
      `, [updates.subscriptionStatus, updates.subscriptionEnd, id]);
      res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
  else if (req.method === 'DELETE') {
    const { id } = req.query;
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