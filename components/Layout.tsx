// components/Layout.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import HamburgerIcon from './HamburgerIcon';
import CloseIcon from './CloseIcon';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('expired');

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSubscriptionStatus(data.subscriptionStatus));
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleHamburger = () => {
    setSidebarOpen(prev => !prev);
    document.dispatchEvent(new Event('toggleSidebar'));
  };

  return (
    <>
      <header className="site-header">
        <button className="mobile-hamburger" onClick={handleHamburger}>
          {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
        <div className="site-logo">AI Tools</div>
        <nav className="site-nav">
          <Link href="/dashboard">Агенты</Link>
          <Link href="/subscribe">Тарифы</Link>
          <Link href="/auth/login">Вход</Link>
        </nav>
      </header>

      {subscriptionStatus === 'trial' && (
        <div className="trial-banner">
          Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        © 2025 AI Tools. <Link href="/about">О проекте</Link> • <Link href="/support">Поддержка</Link> • <Link href="/privacy">Политика</Link> • <Link href="/contacts">Контакты</Link>
      </footer>
    </>
  );
}
