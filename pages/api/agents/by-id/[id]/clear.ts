import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import { openDb } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end()
  }

  const session = await getSession(req)
  if (!session) return res.status(401).end()

  const agentId = req.query.id as string
  const db = await openDb()
  try {
    await db.run(
      'DELETE FROM user_recent_chats WHERE user_id = ? AND chat_id = ?',
      [session.userId, agentId]
    )
  } finally {
    await db.close()
  }

  return res.status(204).end()
}
