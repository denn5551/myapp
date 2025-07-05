// pages/admin/users.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import clsx from 'clsx';

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
    <>
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
    </>
  );
}
