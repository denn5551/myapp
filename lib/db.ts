import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function openDb() {
  const dbPath = path.join(process.cwd(), 'data', 'users.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const cols = await db.all("PRAGMA table_info('agents')");
  if (cols.length > 0) {
    const hasFlag = cols.some(c => c.name === 'display_on_main');
    if (!hasFlag) {
      await db.run('ALTER TABLE agents ADD COLUMN display_on_main INTEGER DEFAULT 0');
    }
  }

  const userCols = await db.all("PRAGMA table_info('users')");
  if (userCols.length === 0) {
    const createStmt = `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      created_at TEXT,
      status TEXT DEFAULT 'trial',
      subscription_ends_at TEXT
    )`;
    if (typeof (db as any).exec === 'function') {
      await (db as any).exec(createStmt);
    } else {
      await db.run(createStmt);
    }
  } else {
    const hasStatus = userCols.some(c => c.name === 'status');
    if (!hasStatus) {
      await db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'trial'");
    }
    const hasEnds = userCols.some(c => c.name === 'subscription_ends_at');
    if (!hasEnds) {
      await db.run("ALTER TABLE users ADD COLUMN subscription_ends_at TEXT");
    }
  }
  return db;
}
