import { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = req.headers.cookie || '';
  const emailCookie = cookies.split(';').find(c => c.trim().startsWith('email='));
  const decodedEmail = emailCookie ? decodeURIComponent(emailCookie.split('=')[1]) : null;
  if (!decodedEmail) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const db = await openDb();
  const user = await db.get(
    'SELECT email, created_at, status, subscription_ends_at as subscriptionEndsAt FROM users WHERE email = ?',
    decodedEmail
  );
  await db.close();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json({
    email: user.email,
    registeredAt: user.created_at,
    status: user.status,
    subscriptionEndsAt: user.subscriptionEndsAt
      ? new Date(user.subscriptionEndsAt).toISOString()
      : null,
    isAdmin: decodedEmail === 'kcc-kem@ya.ru',
  });
}
