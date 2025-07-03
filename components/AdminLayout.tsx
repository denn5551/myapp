// components/AdminLayout.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Проверяем email в куке для доступа к админке
    const encodedEmail = document.cookie
      .split('; ')
      .find(row => row.startsWith('email='))
      ?.split('=')[1];

    // Декодируем email из куки
    const email = encodedEmail ? decodeURIComponent(encodedEmail) : null;
    console.log('Decoded email:', email); // Для отладки

    if (email !== 'kcc-kem@ya.ru') {
      router.push('/auth/login');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} p-8`}>
        {children}
      </main>
    </div>
  );
}