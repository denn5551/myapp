import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from '@/lib/auth'
import openDb from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSession(req)
  if (!session) return res.status(401).end()
  const chatId = req.query.id as string
  const db = await openDb()
  await db.run(
    `\n    INSERT INTO user_recent_chats(user_id, chat_id, last_message_at)
    VALUES (?, ?, datetime('now','localtime'))
    ON CONFLICT(user_id, chat_id) DO UPDATE
      SET last_message_at = excluded.last_message_at;\n  `,
    [session.userId, chatId]
  )
  await db.close()
  return res.status(204).end()
}
