import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminSidebar() {
  const router = useRouter();
  const currentPath = router.pathname;

  const menuItems = [
    { href: '/admin/agents', label: '👥 ИИ-Агенты' },
    { href: '/admin/categories', label: '📁 Категории' },
    { href: '/admin/users', label: '👤 Пользователи' }
  ];

  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold mb-2">AdminKit Pro</h1>
        <div className="text-gray-400 text-sm">
          <div>Админ</div>
          <div>kcc-kem@ya.ru</div>
        </div>
      </div>

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

      <div className="mt-auto pt-8">
        <Link
          href="/dashboard"
          className="block py-2 px-4 text-gray-400 hover:text-white transition-colors"
        >
          ← Вернуться на сайт
        </Link>
      </div>
    </div>
  );
} 