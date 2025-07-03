// pages/admin/users.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

interface User {
  id: number;
  email: string;
  registeredAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionStart: string;
  subscriptionEnd: string;
}

const initialUsers: User[] = [
  {
    id: 1,
    email: 'user1@example.com',
    registeredAt: '2025-06-10',
    subscriptionStatus: 'trial',
    subscriptionStart: '2025-06-10',
    subscriptionEnd: '2025-06-13',
  },
  {
    id: 2,
    email: 'user2@example.com',
    registeredAt: '2025-06-09',
    subscriptionStatus: 'active',
    subscriptionStart: '2025-06-09',
    subscriptionEnd: '2025-07-09',
  },
  {
    id: 3,
    email: 'user3@example.com',
    registeredAt: '2025-06-01',
    subscriptionStatus: 'expired',
    subscriptionStart: '2025-06-01',
    subscriptionEnd: '2025-06-04',
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);

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

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Пользователи</h1>
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Дата регистрации</th>
                <th className="border p-2 text-left">Статус</th>
                <th className="border p-2 text-left">Начало подписки</th>
                <th className="border p-2 text-left">Окончание подписки</th>
                <th className="border p-2 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="text-sm">
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{user.registeredAt}</td>
                  <td className="border p-2">
                    <select
                      className="border rounded px-2 py-1 w-full"
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
                      className="border rounded px-2 py-1 w-full"
                      value={user.subscriptionEnd}
                      onChange={e => handleEndDateChange(user.id, e.target.value)}
                    />
                  </td>
                  <td className="border p-2 text-center">
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
        </div>
      </div>
    </AdminLayout>
  );
}
