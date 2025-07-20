import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  }
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = req.headers.cookie || '';
  const emailCookie = cookies.split(';').find(c => c.trim().startsWith('email='));
  const decodedEmail = emailCookie ? decodeURIComponent(emailCookie.split('=')[1]) : null;
  const hasPaid = cookies.includes('subscriptionPaid=true');
  if (!decodedEmail) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const now = new Date();
  const registered = new Date(); // Используем текущую дату как дату регистрации
  const diffInDays = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));


  let status: 'trial' | 'active' | 'expired' = 'expired';

  if (hasPaid) {
    status = 'active';
  } else if (diffInDays < 7) {
    status = 'trial';
  }

  res.status(200).json({
    email: decodedEmail,
    registeredAt: registered.toISOString(),
    subscriptionStatus: status,
    trialEndsIn: 7 - diffInDays,
    isAdmin: decodedEmail === 'kcc-kem@ya.ru'
  });
}
