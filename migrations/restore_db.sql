-- Скрипт для восстановления базы данных SQLite
-- Путь к БД: ./data/users.db

-- Включаем поддержку внешних ключей
PRAGMA foreign_keys = ON;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT,
  status TEXT DEFAULT 'trial',
  subscription_start TEXT,
  subscription_end TEXT,
  created_at TEXT
);

-- Таблица категорий агентов
CREATE TABLE IF NOT EXISTS agent_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  description TEXT
);

-- Таблица агентов
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  full_description TEXT,
  category_id INTEGER,
  slug TEXT,
  is_active INTEGER,
  display_on_main INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (category_id) REFERENCES agent_categories(id)
);

-- Таблица избранных агентов пользователей
CREATE TABLE IF NOT EXISTS user_favorite_agents (
  user_id    INTEGER    NOT NULL,
  agent_id   TEXT       NOT NULL,
  created_at TEXT       NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, agent_id),
  FOREIGN KEY (user_id)  REFERENCES users  (id)   ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents (id)   ON DELETE CASCADE
);

-- Таблица недавних чатов пользователей
CREATE TABLE IF NOT EXISTS user_recent_chats (
  user_id         INTEGER    NOT NULL,
  chat_id         TEXT       NOT NULL,
  last_message_at TEXT       NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, chat_id),
  FOREIGN KEY (user_id) REFERENCES users (id)    ON DELETE CASCADE
);

-- Таблица загруженных файлов
CREATE TABLE IF NOT EXISTS UploadAsset (
  id        TEXT PRIMARY KEY,
  url       TEXT NOT NULL,
  name      TEXT NOT NULL,
  size      INTEGER NOT NULL,
  mime      TEXT NOT NULL,
  isImage   INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Индексы для агентов
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);

-- Индексы для избранных агентов
CREATE INDEX IF NOT EXISTS idx_fav_by_user  ON user_favorite_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_fav_by_agent ON user_favorite_agents(agent_id);

-- Индексы для недавних чатов
CREATE INDEX IF NOT EXISTS idx_recent_by_user ON user_recent_chats(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_by_last_at ON user_recent_chats(last_message_at);

-- Индексы для загруженных файлов
CREATE INDEX IF NOT EXISTS idx_UploadAsset_createdAt ON UploadAsset(createdAt);
