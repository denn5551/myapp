import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie || '';
  const emailCookie = cookies.split(';').find(c => c.trim().startsWith('email='));
  const email = emailCookie ? decodeURIComponent(emailCookie.split('=')[1]) : null;
  const hasPaid = cookies.includes('subscriptionPaid=true');

  if (!email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const now = new Date();
  const registered = new Date(); // Используем текущую дату как дату регистрации
  const diffInDays = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'trial' | 'active' | 'expired' = 'expired';

  if (hasPaid) {
    status = 'active';
  } else if (diffInDays < 3) {
    status = 'trial';
  }

  res.status(200).json({
    email,
    registeredAt: registered.toISOString(),
    subscriptionStatus: status,
    trialEndsIn: 3 - diffInDays,
    isAdmin: email === 'kcc-kem@ya.ru'
  });
}
