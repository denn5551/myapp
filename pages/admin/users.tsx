// pages/admin/users.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

interface User {
  id: number;
  email: string;
  created_at: string;
  status: 'trial' | 'active' | 'expired';
  subscription_ends_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => {});
  }, []);

  async function handleFieldChange(
    userId: number,
    newStatus: User['status'],
    newDate: string | null
  ) {
    const body = { status: newStatus, subscriptionEndsAt: newDate || null };
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return;
    }
    const updated = await res.json();
    setUsers(prev => prev.map(u => (u.id === userId ? updated : u)));
  }

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
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
            <th className="border p-2">Окончание подписки</th>
            <th className="border p-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="text-sm text-center">
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.created_at}</td>
              <td className="border p-2">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={user.status}
                  onChange={e =>
                    handleFieldChange(
                      user.id,
                      e.target.value as User['status'],
                      user.subscription_ends_at
                    )
                  }
                >
                  <option value="trial">trial</option>
                  <option value="active">active</option>
                  <option value="expired">expired</option>
                </select>
              </td>
              <td className="border p-2">
                <input
                  type="date"
                  className="border rounded px-2 py-1 text-sm"
                  value={user.subscription_ends_at ? user.subscription_ends_at.split('T')[0] : ''}
                  onChange={e =>
                    handleFieldChange(
                      user.id,
                      user.status,
                      e.target.value || null
                    )
                  }
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
