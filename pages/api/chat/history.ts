import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/auth';
import { openMainDb } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { agentSlug } = req.query;
  if (!agentSlug || typeof agentSlug !== 'string') {
    return res.status(400).json({ error: 'Missing agentSlug parameter' });
  }

  try {
    const db = await openMainDb();
    
    const messages = await db.all(
      `SELECT role, text, attachments, created_at 
       FROM chat_messages 
       WHERE user_id = ? AND agent_slug = ? 
       ORDER BY created_at ASC`,
      [session.userId, agentSlug]
    );

    await db.close();

    // Парсим attachments из JSON
    const parsedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.text,
      attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
      created_at: msg.created_at
    }));

    return res.status(200).json({ messages: parsedMessages });
  } catch (error: any) {
    console.error('[CHAT HISTORY ERROR]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 