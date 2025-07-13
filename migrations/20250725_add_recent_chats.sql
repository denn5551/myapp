BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS user_recent_chats (
  user_id         INTEGER    NOT NULL,
  chat_id         TEXT       NOT NULL,
  last_message_at TEXT       NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, chat_id),
  FOREIGN KEY (user_id) REFERENCES users (id)    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recent_by_user ON user_recent_chats(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_by_last_at ON user_recent_chats(last_message_at);
COMMIT;
