import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export async function openDb() {
  const candidates = [
    path.join(process.cwd(), 'data', 'users.db'),
    path.join(process.cwd(), '..', 'data', 'users.db'),
    path.join(process.cwd(), '..', '..', 'data', 'users.db'),
    path.join(__dirname, '..', 'data', 'users.db'),
    path.join(__dirname, '..', '..', 'data', 'users.db'),
  ];

  const dbPath = candidates.find((p) => fs.existsSync(p));
  if (!dbPath) {
    throw new Error('users.db not found');
  }

  return open({ filename: dbPath, driver: sqlite3.Database });
}
