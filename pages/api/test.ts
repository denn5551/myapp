import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({ 
    message: 'API работает',
    openaiKey: process.env.OPENAI_API_KEY ? 'установлен' : 'не установлен',
    timestamp: new Date().toISOString()
  });
} 