import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import { openDb } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSession(req)
  if (!session) return res.status(401).end()
  const userId = session.userId
  const cursor = req.query.cursor as string | undefined
  const limit = parseInt((req.query.limit as string) || '10')
  const db = await openDb()
  const rows = await db.all(
    `SELECT ur.chat_id, ur.last_message_at, a.name AS title
       FROM user_recent_chats ur
       JOIN agents a ON a.id = ur.chat_id
      WHERE ur.user_id = ?
        AND ur.last_message_at < COALESCE(?, datetime('now','localtime'))
      ORDER BY ur.last_message_at DESC
      LIMIT ?;`,
    [userId, cursor ?? null, limit]
  )
  await db.close()
  const nextCursor = rows.length === limit ? rows[rows.length - 1].last_message_at : null
  const chats = rows.map(r => ({
    chat_id: r.chat_id,
    title: r.title,
    last_message_at: r.last_message_at
  }))
  return res.status(200).json({ chats, nextCursor })
}
