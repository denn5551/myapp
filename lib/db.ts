import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function openDb() {
  const dbPath = path.join(process.cwd(), 'data', 'users.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const cols = await db.all("PRAGMA table_info('agents')");
  const hasFlag = cols.some(c => c.name === 'display_on_main');
  if (!hasFlag) {
    await db.run('ALTER TABLE agents ADD COLUMN display_on_main INTEGER DEFAULT 0');
  }
  return db;
}
