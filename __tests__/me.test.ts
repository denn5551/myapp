import handler from '../pages/api/me';
import httpMocks from 'node-mocks-http';
import { openDb } from '../lib/db';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

describe('me api', () => {
  it('returns user info when email cookie present', async () => {
    const dbPath = path.join(process.cwd(), 'data', 'users.db');
    const raw = await open({ filename: dbPath, driver: sqlite3.Database });
    await raw.run('CREATE TABLE IF NOT EXISTS agents (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
    await raw.close();
    const db = await openDb();
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + 1);
    await db.run(
      'INSERT OR REPLACE INTO users (email, password, status, subscription_start, subscription_end, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        'test@example.com',
        'hashed',
        'active',
        now.toISOString(),
        future.toISOString(),
        now.toISOString(),
      ]
    );
    await db.close();

    const req = httpMocks.createRequest({
      method: 'GET',
      headers: {
        cookie: 'email=test%40example.com'
      }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.email).toBe('test@example.com');
    expect(data.subscriptionStatus).toBe('active');
    expect(data.subscriptionEnd).toBe(future.toISOString());

    const dbCleanup = await openDb();
    await dbCleanup.run('DELETE FROM users WHERE email = ?', 'test@example.com');
    await dbCleanup.close();
  });
});
