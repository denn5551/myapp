import fs from 'fs'

test('migration creates user_recent_chats table', () => {
  const sql = fs.readFileSync('migrations/20250725_add_recent_chats.sql', 'utf8')
  expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS user_recent_chats/)
  expect(sql).toMatch(/idx_recent_by_user/)
  expect(sql).toMatch(/idx_recent_by_last_at/)
})
