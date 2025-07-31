import { openDb } from './db'

export async function getAgentBySlug(slug: string) {
  const db = await openDb()
  const row = await db.get('SELECT * FROM agents WHERE slug = ?', slug)
  await db.close()
  if (!row) return null
  return {
    assistantId: row.id,
    name: row.name,
    prompt: row.description || '',
  }
}
