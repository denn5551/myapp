import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';

export function TrialBanner() {
  const router = useRouter();
  if (router.pathname.startsWith('/admin')) {
    return null;
  }

  const { user, hasPlus } = useUser();
  if (!user) return null;

  console.log({ status: user.status, subscriptionEndsAt: user.subscriptionEndsAt, hasPlus });

  if (hasPlus || user.status !== 'trial' || !user.subscriptionEndsAt) return null;
  const end = new Date(user.subscriptionEndsAt);
  const now = new Date();
  if (now >= end) return null;
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);

  return (
    <div className="fixed top-0 inset-x-0 bg-yellow-100 border-b border-yellow-300 z-[1000]">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 py-3">
        <div className="text-sm text-yellow-900">
          Осталось <span className="font-semibold">{daysLeft}</span>{' '}
          {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}.{' '}
          Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.
        </div>
        <Link
          href="/subscribe"
          className="mt-2 md:mt-0 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Оформить
        </Link>
      </div>
    </div>
  );
}
