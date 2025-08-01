import { openDb } from './db'

export async function getAgentBySlug(slug: string) {
  const db = await openDb()
  const row = await db.get(
    `SELECT a.*, c.name as category_name FROM agents a
     LEFT JOIN agent_categories c ON a.category_id = c.id
     WHERE a.slug = ?`,
    slug
  )
  await db.close()
  if (!row) return null
  return {
    assistantId: row.id,
    name: row.name,
    description: row.description || '',
    short: row.short_description || '',
    category: row.category_name || '',
  }
}
