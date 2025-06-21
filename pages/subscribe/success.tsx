import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SubscribeSuccess() {
  const router = useRouter();
  const { plan } = router.query;

  useEffect(() => {
    // Сохраняем cookie, имитируя успешную оплату
    document.cookie = 'subscriptionPaid=true; path=/; max-age=31536000'; // 1 год

    // Перенаправление через 3 секунды
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main style={{ textAlign: 'center', paddingTop: 60 }}>
      <h1>✅ Подписка активирована!</h1>
      <p style={{ fontSize: '18px', marginTop: 16 }}>
        Тариф: <strong>{plan === 'monthly' ? '1 месяц' : plan}</strong>
      </p>
      <p>Сейчас вы будете перенаправлены в личный кабинет...</p>
    </main>
  );
}
