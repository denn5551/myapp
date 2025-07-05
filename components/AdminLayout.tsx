// components/AdminLayout.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import clsx from 'clsx';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.isAdmin) {
          router.push('/');
        } else {
          setIsAdmin(true);
          setLoading(false);
        }
      })
      .catch(() => router.push('/'));
  }, [router]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { label: 'ИИ-Агенты \ud83d\udcc1', href: '/admin/agents' },
    { label: 'Категории \ud83d\udc64', href: '/admin/categories' },
    { label: 'Пользователи', href: '/admin/users' },
  ];

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <nav className="admin-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'admin-menu-link',
                router.pathname === item.href && 'active'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-content">{children}</main>
    </div>
  );
}
