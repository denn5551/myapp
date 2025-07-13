import { NextApiRequest } from 'next'
import { openDb } from './db'

export async function getSession(req: NextApiRequest) {
  const cookies = req.headers.cookie || ''
  const emailCookie = cookies.split(';').find(c => c.trim().startsWith('email='))
  if (!emailCookie) return null
  const email = decodeURIComponent(emailCookie.split('=')[1])
  const db = await openDb()
  const user = await db.get('SELECT id FROM users WHERE email = ?', email)
  await db.close()
  if (!user) return null
  return { userId: user.id as number, email }
}
