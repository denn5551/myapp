import type { NextApiRequest, NextApiResponse } from 'next';
import { openDb } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = await openDb();

  if (req.method === 'PATCH') {
    const { status, subscriptionEndsAt } = req.body;
    const current = await db.get('SELECT * FROM users WHERE id = ?', id);
    if (!current) {
      await db.close();
      return res.status(404).json({ message: 'User not found' });
    }
    const ends = subscriptionEndsAt ? subscriptionEndsAt : null;
    await db.run(
      'UPDATE users SET status = ?, subscription_ends_at = ? WHERE id = ?',
      [status ?? current.status, ends, id]
    );
    const row = await db.get(
      'SELECT id, email, created_at, status, subscription_ends_at as subscriptionEndsAt FROM users WHERE id = ?',
      id
    );
    await db.close();
    return res.status(200).json({
      ...row,
      subscriptionEndsAt: row.subscriptionEndsAt
        ? new Date(row.subscriptionEndsAt).toISOString()
        : null,
    });
  }

  await db.close();
  return res.status(405).end();
}
