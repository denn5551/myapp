// pages/subscribe.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import { useSidebarState } from '@/hooks/useSidebarState';
import PlanCard, { Plan } from '@/components/PlanCard';

/** Subscription plans available on the page. */
const plans: Plan[] = [
  {
    id: 'standard',
    title: 'Standard',
    price: '999 ₽/мес',
    features: [
      'Неограниченный доступ ко всем агентам',
      'Круглосуточная техподдержка',
      'Персональные рекомендации AI-консультанта',
      'Еженедельные отчёты о работе',
      'Приоритетное обновление новых функций',
    ],
    isActive: true,
  },
  {
    id: 'standard12',
    title: 'Standard 12',
    price: '—',
    features: [
      '12-месячная предоплата',
      'Скидка 15 % (в разраб.)',
      'Все преимущества Standard',
    ],
    isActive: false,
  },
];

/** Page for managing user subscription. */
export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');
  const { sidebarOpen, toggleSidebar } = useSidebarState();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEmail(data.email || '');
        setSubscriptionStatus(data.subscriptionStatus || 'expired');
      });
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', { credentials: 'include' });
      if (res.ok) {
        window.location.href = '/auth/login';
      }
    } catch (e) {
      console.error('Ошибка при выходе:', e);
    }
  };

  const onSubscribe = (planId: string) => {
    console.log('subscribe', planId);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'} p-6`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <h1 className="header__title">Подписка</h1>
          <div className="header__user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <span className="user-avatar">{email.charAt(0).toUpperCase()}</span>
            {userMenuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link href="/profile">Профиль</Link>
                </li>
                <li>
                  <button onClick={handleLogout}>Выйти</button>
                </li>
              </ul>
            )}
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onSubscribe={onSubscribe} />
          ))}
        </div>
      </main>
    </div>
  );
}
