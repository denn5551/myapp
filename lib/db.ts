import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export async function openDb() {
  let dbPath = path.join(process.cwd(), 'data', 'users.db');
  if (!fs.existsSync(dbPath)) {
    dbPath = path.join(process.cwd(), '..', '..', 'data', 'users.db');
  }
  return open({ filename: dbPath, driver: sqlite3.Database });
}
