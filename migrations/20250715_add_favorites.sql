BEGIN TRANSACTION;
CREATE TABLE user_favorite_agents (
  user_id    INTEGER    NOT NULL,
  agent_id   TEXT       NOT NULL,
  created_at TEXT       NOT NULL DEFAULT (datetime('now','localtime')),
  PRIMARY KEY (user_id, agent_id),
  FOREIGN KEY (user_id)  REFERENCES users  (id)   ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents (id)   ON DELETE CASCADE
);
CREATE INDEX idx_fav_by_user  ON user_favorite_agents(user_id);
CREATE INDEX idx_fav_by_agent ON user_favorite_agents(agent_id);
COMMIT;
