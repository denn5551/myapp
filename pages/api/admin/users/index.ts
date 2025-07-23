import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDb();

  if (req.method === 'GET') {
    const rows = await db.all(
      'SELECT id, email, created_at, status, subscription_ends_at as subscriptionEndsAt FROM users'
    );
    await db.close();
    return res.status(200).json(
      rows.map(r => ({
        ...r,
        subscriptionEndsAt: r.subscriptionEndsAt
          ? new Date(r.subscriptionEndsAt).toISOString()
          : null,
      }))
    );
  }

  await db.close();
  return res.status(405).end();
}
