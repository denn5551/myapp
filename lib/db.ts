import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function openDb() {
  const dbPath = path.join(process.cwd(), 'data', 'users.db');
  return open({ filename: dbPath, driver: sqlite3.Database });
}
