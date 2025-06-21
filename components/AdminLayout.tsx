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
  const navItems = [
    { label: 'Главная', href: '/dashboard' },
    { label: 'Пользователи', href: '/admin/users' },
    { label: 'Категории', href: '/admin/categories' },
    { label: 'Агенты', href: '/admin/agents' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'} bg-gray-100 w-64 p-4`}>  
        <div className="sidebar-header flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Админка</h2>
          <button className="text-sm text-gray-600" onClick={toggleSidebar}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'block px-3 py-2 rounded hover:bg-gray-200',
                router.pathname === item.href && 'bg-gray-300 font-medium'
              )}
              style={{ display: 'block', width: '100%' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'} p-6 overflow-x-auto`}>
        {children}
      </main>
    </div>
  );
}