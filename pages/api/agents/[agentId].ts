import type { NextApiRequest, NextApiResponse } from 'next'
import { getAgentBySlug } from '../../../lib/getAgentBySlug'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }
  const { slug } = req.query
  if (typeof slug !== 'string') {
    return res.status(400).json({ message: 'Missing slug' })
  }
  const agent = await getAgentBySlug(slug)
  if (!agent) {
    return res.status(404).json({ message: 'Agent not found' })
  }
  return res.status(200).json({
    name: agent.name,
    slug,
    assistant_id: agent.assistantId,
  })
}

