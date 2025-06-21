import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ResetSubscriptionPage() {
  const router = useRouter();

  useEffect(() => {
    // Удаляем cookie вручную (будет работать при SSR)
    document.cookie = 'subscriptionPaid=; Max-Age=0; path=/';

    // Ждём чуть-чуть и редиректим
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  }, [router]);

  return (
    <main style={{ padding: '40px', textAlign: 'center' }}>
      <h2>🔄 Подписка сброшена</h2>
      <p>Вы будете перенаправлены обратно на дашборд...</p>
    </main>
  );
}
