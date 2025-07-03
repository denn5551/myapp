// pages/admin/users.tsx
import { useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useUserStore } from '@/store/userStore';
import type { User } from '@/store/userStore';

export default function AdminUsersPage() {
  const { users, setUsers } = useUserStore();

  // Загрузка пользователей при монтировании компонента
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };
    fetchUsers();
  }, [setUsers]);

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Пользователи</title>
      </Head>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Пользователи</h1>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Дата регистрации</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="text-sm">
                  <td className="border p-2">{user.id}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{new Date(user.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
