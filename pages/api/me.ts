import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, subscriptionPaid } = req.cookies as {
    email?: string;
    subscriptionPaid?: string;
  };

  const decodedEmail = email ? decodeURIComponent(email) : null;

  if (!decodedEmail) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const now = new Date();
  const registered = new Date(); // Используем текущую дату как дату регистрации
  const diffInDays = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));

  const hasPaid = subscriptionPaid === 'true';

  let status: 'trial' | 'active' | 'expired' = 'expired';

  if (hasPaid) {
    status = 'active';
  } else if (diffInDays < 3) {
    status = 'trial';
  }

  res.status(200).json({
    email: decodedEmail,
    registeredAt: registered.toISOString(),
    subscriptionStatus: status,
    trialEndsIn: 3 - diffInDays,
    isAdmin: decodedEmail === 'kcc-kem@ya.ru'
  });
}
