import Link from 'next/link';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';

export function TrialBanner() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { user, hasPlus } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  console.log('🔔 TrialBanner render:', {
    pathname: router.pathname,
    user,
    hasPlus,
  });

  if (!mounted) return null;
  if (router.pathname.startsWith('/admin')) return null;
  if (!user || hasPlus || user.status !== 'trial') return null;
  const ends = new Date(user.subscriptionEndsAt || '').getTime();
  if (isNaN(ends) || Date.now() >= ends) return null;

  const daysLeft = Math.ceil((ends - Date.now()) / 86400000);

  const banner = (
    <div data-testid="trial-banner" className="fixed top-0 inset-x-0 h-12 bg-yellow-100 border-b border-yellow-300 z-[9999]">
      <div className="max-w-screen-xl mx-auto h-full flex items-center justify-between px-4">
        Осталось <span className="font-semibold">{daysLeft}</span>{' '}
        {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}.{' '}
        Чтобы пользоваться всеми ИИ-помощниками без ограничений,{' '}
        <Link href="/subscribe" className="underline">оформите подписку</Link>.
      </div>
    </div>
  );

  return createPortal(banner, document.body);
}
