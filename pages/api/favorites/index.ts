import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import openDb from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  const session = await getSession(req)
  if (!session) return res.status(401).end()

  const { agentId } = req.body || {}
  if (!agentId) return res.status(400).json({ error: 'agentId required' })

  const db = await openDb()
  await db.run(
    `INSERT OR IGNORE INTO user_favorite_agents(user_id, agent_id) VALUES(?, ?);`,
    [session.userId, agentId]
  )
  await db.close()

  return res.status(204).end()
}

