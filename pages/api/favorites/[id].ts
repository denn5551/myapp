import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import openDb from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).end()
  }

  const session = await getSession(req)
  if (!session) return res.status(401).end()

  const agentId = req.query.id as string

  const db = await openDb()
  await db.run(
    `DELETE FROM user_favorite_agents WHERE user_id = ? AND agent_id = ?;`,
    [session.userId, agentId]
  )
  await db.close()

  return res.status(204).end()
}

