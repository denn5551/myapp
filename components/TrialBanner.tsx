// components/TrialBanner.tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface TrialBannerProps {
  subscriptionStatus: 'trial' | 'active' | 'expired';
}

export default function TrialBanner({ subscriptionStatus }: TrialBannerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hiddenPaths = ['/subscribe', '/subscribe/success', '/admin'];
    const shouldShow =
      subscriptionStatus === 'trial' &&
      !hiddenPaths.some(path => router.pathname.startsWith(path));
    setVisible(shouldShow);
  }, [router.pathname, subscriptionStatus]);

  if (!visible) return null;

  return (
    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm text-center border-b border-yellow-300 z-50 fixed top-0 left-0 w-full">
      🧪 Пробный период. Чтобы пользоваться всеми ИИ-помощниками без ограничений,{' '}
      <a href="/subscribe" className="underline font-medium hover:text-yellow-900 ml-1">
        оформите подписку
      </a>
    </div>
  );
}
