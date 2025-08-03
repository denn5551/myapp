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
