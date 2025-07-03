import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export default function AdminSidebar({ 
  sidebarOpen, 
  toggleSidebar 
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
    <aside className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 ${
      sidebarOpen ? 'w-64' : 'w-16'
    }`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <h2 className="text-xl font-bold truncate">AdminKit Pro</h2>
            </div>
          )}
          <button 
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center py-2 px-4 rounded transition-colors ${
                  currentPath === href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                {sidebarOpen ? label : label.split(' ')[0]}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="relative">
            <button 
              onClick={toggleUserMenu}
              className="flex items-center w-full p-2 rounded hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                K
              </div>
              {sidebarOpen && (
                <>
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="truncate text-sm">kcc-kem@ya.ru</div>
                    <div className="text-sm text-gray-400">Администратор</div>
                  </div>
                  <div className="ml-2 text-gray-400">
                    {userMenuOpen ? '▲' : '▼'}
                  </div>
                </>
              )}
            </button>
            
            {userMenuOpen && sidebarOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <Link href="/dashboard" className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">
                  ← Вернуться на сайт
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
} 