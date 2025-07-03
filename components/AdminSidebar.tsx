import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface AdminSidebarProps {
  sidebarOpen?: boolean;
  toggleSidebar?: () => void;
}

export default function AdminSidebar({ 
  sidebarOpen = true, 
  toggleSidebar = () => {} 
}: AdminSidebarProps) {
  const router = useRouter();
  const currentPath = router.pathname;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems = [
    { href: '/admin/agents', label: '👥 ИИ-Агенты' },
    { href: '/admin/categories', label: '📁 Категории' },
    { href: '/admin/users', label: '👤 Пользователи' }
  ];

  const toggleUserMenu = () => {
    setUserMenuOpen(prev => !prev);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <h2 className="text-xl font-bold mb-2">AdminKit Pro</h2>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? '←' : '→'}
        </button>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <nav>
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block py-2 px-4 rounded mb-1 transition-colors ${
                  currentPath === href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <button className="user-info-button" onClick={toggleUserMenu}>
            <div className="user-avatar">
              K
            </div>
            <div className="user-details">
              <div className="user-email">kcc-kem@ya.ru</div>
              <div className="text-sm text-gray-400">Администратор</div>
            </div>
            <div className="chevron">
              {userMenuOpen ? '▲' : '▼'}
            </div>
          </button>
          
          {userMenuOpen && (
            <div className="user-menu">
              <Link href="/dashboard" className="user-menu-item">
                ← Вернуться на сайт
              </Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
} 