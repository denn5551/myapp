import type { NextApiRequest, NextApiResponse } from 'next';
import openDb from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query;
  if (typeof email !== 'string') return res.status(400).end();
  const db = await openDb();
  if (req.method === 'PATCH') {
    const { status, subscriptionEnd } = req.body;
    await db.run(
      'UPDATE users SET status = ?, subscription_end = ? WHERE email = ?',
      [status, subscriptionEnd, email]
    );
    const updated = await db.get(
      `SELECT id, email, created_at, status as subscriptionStatus,
              subscription_start as subscriptionStart,
              subscription_end as subscriptionEnd
       FROM users WHERE email = ?`,
      email
    );
    await db.close();
    return res.status(200).json(updated);
  }
  if (req.method === 'DELETE') {
    await db.run('DELETE FROM users WHERE email = ?', email);
    await db.close();
    return res.status(204).end();
  }
  await db.close();
  res.status(405).end();
}
