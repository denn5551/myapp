// components/AdminLayout.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Проверяем email в куке для доступа к админке
    const email = document.cookie
      .split('; ')
      .find(row => row.startsWith('email='))
      ?.split('=')[1];

    if (email !== 'kcc-kem@ya.ru') {
      router.push('/auth/login');
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}