import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Очищаем все куки
  res.setHeader('Set-Cookie', [
    'email=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'subscriptionPaid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);

  res.status(200).json({ success: true });
} 