import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import openDb from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSession(req)
  if (!session) return res.status(401).end()
  const page = parseInt((req.query.page as string) || '1')
  const perPage = parseInt((req.query.perPage as string) || '10')
  const offset = (page - 1) * perPage
  const db = await openDb()
  const totalRow = await db.get(
    'SELECT COUNT(*) as count FROM user_recent_chats WHERE user_id = ?',
    session.userId
  )
  const rows = await db.all(
    `SELECT ur.chat_id AS id, a.slug, a.name, ur.last_message_at as lastMessageAt
       FROM user_recent_chats ur
       JOIN agents a ON a.id = ur.chat_id
      WHERE ur.user_id = ?
      ORDER BY ur.last_message_at DESC
      LIMIT ? OFFSET ?`,
    session.userId,
    perPage,
    offset
  )
  await db.close()
  return res.status(200).json({ chats: rows, page, perPage, total: totalRow.count })
}
