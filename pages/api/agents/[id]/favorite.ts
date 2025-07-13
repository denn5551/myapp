import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import { openDb } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req)
  if (!session) return res.status(401).end()
  const user_id = session.userId
  const agent_id = req.query.id as string
  const db = await openDb()

  if (req.method === 'POST') {
    await db.run(
      `INSERT OR IGNORE INTO user_favorite_agents(user_id, agent_id) VALUES(?,?);`,
      [user_id, agent_id]
    )
    await db.close()
    return res.status(204).end()
  }
  if (req.method === 'DELETE') {
    await db.run(
      `DELETE FROM user_favorite_agents WHERE user_id = ? AND agent_id = ?;`,
      [user_id, agent_id]
    )
    await db.close()
    return res.status(204).end()
  }
  await db.close()
  res.setHeader('Allow', ['POST','DELETE'])
  return res.status(405).end()
}
