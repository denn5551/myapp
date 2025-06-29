// pages/admin/users.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { withAdminAccess } from '@/lib/withAdminAccess';

interface User {
  id: number;
  email: string;
  registeredAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionStart: string;
  subscriptionEnd: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data.users || []));
  }, []);

  const handleStatusChange = (id: number, newStatus: User['subscriptionStatus']) => {
    setUsers(prev =>
      prev.map(user => (user.id === id ? { ...user, subscriptionStatus: newStatus } : user))
    );
  };

  const handleEndDateChange = (id: number, newDate: string) => {
    setUsers(prev =>
      prev.map(user => (user.id === id ? { ...user, subscriptionEnd: newDate } : user))
    );
  };

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Пользователи</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Пользователи</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Email</th>
            <th className="border p-2">Дата регистрации</th>
            <th className="border p-2">Статус</th>
            <th className="border p-2">Начало подписки</th>
            <th className="border p-2">Окончание подписки</th>
            <th className="border p-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="text-sm text-center">
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.registeredAt}</td>
              <td className="border p-2">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={user.subscriptionStatus}
                  onChange={e =>
                    handleStatusChange(user.id, e.target.value as User['subscriptionStatus'])
                  }
                >
                  <option value="trial">trial</option>
                  <option value="active">active</option>
                  <option value="expired">expired</option>
                </select>
              </td>
              <td className="border p-2">{user.subscriptionStart}</td>
              <td className="border p-2">
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={user.subscriptionEnd}
                  onChange={e => handleEndDateChange(user.id, e.target.value)}
                />
              </td>
              <td className="border p-2">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleDelete(user.id)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAccess();
