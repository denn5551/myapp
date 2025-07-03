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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.isAdmin) {
          router.push('/');
        }
        setIsAdmin(data.isAdmin);
        setLoading(false);
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const navItems = [
    { label: 'Дашборд', href: '/dashboard', icon: '📊' },
    { label: 'Пользователи', href: '/admin/users', icon: '👥' },
    { label: 'Категории', href: '/admin/categories', icon: '📁' },
    { label: 'Агенты', href: '/admin/agents', icon: '🤖' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#1e2937] transition-all duration-300`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {sidebarOpen ? (
              <h1 className="text-white text-xl font-semibold">AdminKit Pro</h1>
            ) : (
              <h1 className="text-white text-xl font-semibold">A</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

          <nav className="flex-1 p-4">
            {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                  'flex items-center px-4 py-3 mb-2 rounded-lg transition-colors',
                  router.pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}
              >
                <span className="mr-3">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white">
                A
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">Админ</p>
                  <p className="text-xs text-gray-400">kcc-kem@ya.ru</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
        {children}
        </div>
      </main>
    </div>
  );
}