import type { NextApiRequest, NextApiResponse } from 'next'
import { getAgentBySlug } from '../../../lib/getAgentBySlug'
import { getSession } from '../../../lib/auth'
import openDb from '../../../lib/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }

  const slugParam = Array.isArray(req.query.slug)
    ? req.query.slug[0]
    : req.query.slug
  if (!slugParam || typeof slugParam !== 'string') {
    return res.status(400).json({ message: 'Missing slug' })
  }
  const slug = decodeURIComponent(slugParam)

  const agent = await getAgentBySlug(slug)
  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' })
  }

  let isFavorite = false
  const session = await getSession(req)
  if (session) {
    const db = await openDb()
    const fav = await db.get(
      'SELECT 1 FROM user_favorite_agents WHERE user_id = ? AND agent_id = ?',
      [session.userId, agent.assistantId]
    )
    await db.close()
    isFavorite = !!fav
  }

  return res.status(200).json({
    name: agent.name,
    slug,
    assistant_id: agent.assistantId,
    category: agent.category,
    description: agent.description,
    isFavorite,
  })
}

