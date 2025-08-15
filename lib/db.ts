import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import path from 'path'
import { slugify } from './slugify'

export async function openDb() {
  const dbPath = path.join(process.cwd(), 'data', 'users.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    status TEXT DEFAULT 'trial',
    subscription_start TEXT,
    subscription_end TEXT,
    created_at TEXT
  )`)
  const userCols = await db.all("PRAGMA table_info('users')")
  if (!userCols.some(c => c.name === 'status')) {
    await db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'trial'")
  }
  if (!userCols.some(c => c.name === 'subscription_start')) {
    await db.run("ALTER TABLE users ADD COLUMN subscription_start TEXT")
  }
  if (!userCols.some(c => c.name === 'subscription_end')) {
    await db.run("ALTER TABLE users ADD COLUMN subscription_end TEXT")
  }
  const cols = await db.all("PRAGMA table_info('agents')")
  const hasFlag = cols.some(c => c.name === 'display_on_main')
  if (!hasFlag) {
    await db.run('ALTER TABLE agents ADD COLUMN display_on_main INTEGER DEFAULT 0')
  }
  const hasSlug = cols.some(c => c.name === 'slug')
  if (!hasSlug) {
    await db.run('ALTER TABLE agents ADD COLUMN slug TEXT')
  }
  await db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug)')
  const missing = await db.all("SELECT id, name FROM agents WHERE slug IS NULL OR slug = ''")
  for (const row of missing) {
    await db.run('UPDATE agents SET slug=? WHERE id=?', slugify(row.name), row.id)
  }
  return db
}

export async function openMainDb() {
  const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  
  // Создаем таблицу chat_messages если её нет
  await db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      agent_slug TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      text TEXT NOT NULL,
      attachments TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  // Создаем индексы
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user_agent 
    ON chat_messages(user_id, agent_slug)
  `);
  
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
    ON chat_messages(created_at)
  `);
  
  return db;
}
