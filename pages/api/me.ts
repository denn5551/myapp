import { NextApiRequest, NextApiResponse } from 'next';

// Входные данные — можно удалить, если не используешь
const fakeUser = {
  email: 'user@example.com',
  registeredAt: '2025-06-17T10:00:00Z', // дата регистрации ISO
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = req.headers.cookie || '';
  const hasPaid = cookies.includes('subscriptionPaid=true');

  const now = new Date();
  const registered = new Date(fakeUser.registeredAt);
  const diffInDays = Math.floor((now.getTime() - registered.getTime()) / (1000 * 60 * 60 * 24));

  let status: 'trial' | 'active' | 'expired' = 'expired';

  if (hasPaid) {
    status = 'active';
  } else if (diffInDays < 3) {
    status = 'trial';
  }

  res.status(200).json({
    email: fakeUser.email,
    registeredAt: fakeUser.registeredAt,
    subscriptionStatus: status,
    trialEndsIn: 3 - diffInDays,
  });
}
