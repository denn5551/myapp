// pages/subscribe.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SubscribePage() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setSubscriptionStatus(data.subscriptionStatus || 'expired');
      });
  }, []);

  return (
    <main style={{ padding: '40px' }}>
  <h1>Выберите тариф</h1>
  <div className="grid">
    <div className="card">
      <h3>1 месяц</h3>
      <p>Доступ ко всем ИИ-помощникам</p>
      <Link href="/subscribe/success?plan=monthly" className="chat-send-button">
        Оплатить 490 ₽
      </Link>
    </div>
    <div className="card">
      <h3>6 месяцев</h3>
      <p>Экономия 15%</p>
      <Link href="/subscribe/success?plan=halfyear" className="chat-send-button">
        Оплатить 2490 ₽
      </Link>
    </div>
    <div className="card">
      <h3>1 год</h3>
      <p>Экономия 30%</p>
      <Link href="/subscribe/success?plan=yearly" className="chat-send-button">
        Оплатить 3990 ₽
      </Link>
    </div>
  </div>
</main>
  );
}
