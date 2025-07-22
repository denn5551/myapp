import Link from 'next/link';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import { useUser } from '@/hooks/useUser';

export function TrialBanner() {
  const router = useRouter();
  const { user, hasPlus } = useUser();
  console.log('\ud83d\udd14 TrialBanner render:', {
    pathname: router.pathname,
    user,
    hasPlus,
  });

  // 1. Скрываем в админке
  if (router.pathname.startsWith('/admin')) return null;
  // 2. Только trial-пользователи
  if (!user || hasPlus || user.status !== 'trial') return null;
  // 3. Проверяем дату
  const ends = new Date(user.subscriptionEndsAt || '').getTime();
  if (isNaN(ends) || Date.now() >= ends) return null;

  const daysLeft = Math.ceil((ends - Date.now()) / 86400000);

  const banner = (
    <div data-testid="trial-banner" className="fixed top-0 inset-x-0 h-12 bg-yellow-100 border-b border-yellow-300 z-[9999]">
      <div className="max-w-screen-xl mx-auto h-full flex items-center justify-between px-4">
        Осталось <span className="font-semibold">{daysLeft}</span> {daysLeft === 1 ? 'день' : 'дней'}.{' '}
        Чтобы пользоваться всеми ИИ-помощниками без ограничений,
        <Link href="/subscribe" className="underline">оформите подписку</Link>.
      </div>
    </div>
  );

  // 4. Рендерим в body
  return createPortal(banner, document.body);
}
