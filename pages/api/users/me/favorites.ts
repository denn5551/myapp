import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import openDb from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req)
  if (!session) return res.status(401).end()
  const user_id = session.userId
  const db = await openDb()

  const favorites = await db.all(
    `SELECT a.id, a.slug, a.name, a.short_description
       FROM agents a
       JOIN user_favorite_agents f ON f.agent_id = a.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC;`,
    [user_id]
  )
  await db.close()
  return res.status(200).json({ agents: favorites })
}
