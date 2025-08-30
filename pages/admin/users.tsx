// pages/admin/users.tsx
import { useState, useEffect, FormEvent } from 'react';
import Head from 'next/head';

interface User {
  id: number;
  email: string;
  registeredAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
  subscriptionStart: string;
  subscriptionEnd: string;
}

const initialUsers: User[] = [];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        const mapped = data.map((u: any) => ({
          id: u.id,
          email: u.email,
          registeredAt: u.created_at,
          subscriptionStatus: u.subscriptionStatus || 'trial',
          subscriptionStart: u.subscriptionStart?.slice(0, 10) || '',
          subscriptionEnd: u.subscriptionEnd?.slice(0, 10) || '',
        }));
        setUsers(mapped);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleStatusChange = async (id: number, email: string, newStatus: User['subscriptionStatus']) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    try {
      const isoEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString() : null;
      await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, subscriptionEnd: isoEnd })
      });
      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, subscriptionStatus: newStatus } : u))
      );
    } catch (e) {
      console.error(e);
      alert('Ошибка обновления пользователя');
    }
  };

  const handleEndDateChange = async (id: number, email: string, newDate: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const iso = new Date(newDate).toISOString();
    try {
      await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: user.subscriptionStatus, subscriptionEnd: iso })
      });
      setUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, subscriptionEnd: newDate } : u))
      );
    } catch (e) {
      console.error(e);
      alert('Ошибка обновления пользователя');
    }
  };

  const handleDelete = async (id: number, email: string) => {
    try {
      await fetch(`/api/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (e) {
      console.error(e);
      alert('Ошибка удаления пользователя');
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const mapped: User = {
        id: data.id,
        email: data.email,
        registeredAt: data.created_at,
        subscriptionStatus: data.subscriptionStatus || 'trial',
        subscriptionStart: data.subscriptionStart?.slice(0, 10) || '',
        subscriptionEnd: data.subscriptionEnd?.slice(0, 10) || ''
      };
      setUsers(prev => [...prev, mapped]);
      setNewEmail('');
      setNewPassword('');
    } catch (e) {
      console.error(e);
      alert('Ошибка добавления пользователя');
    }
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
                    handleStatusChange(
                      user.id,
                      user.email,
                      e.target.value as User['subscriptionStatus']
                    )
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
                  onChange={e => handleEndDateChange(user.id, user.email, e.target.value)}
                />
              </td>
              <td className="border p-2">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleDelete(user.id, user.email)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={handleAddUser} className="mt-4 flex gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-sm mb-1">Email</label>
          <input
            type="email"
            className="border rounded px-2 py-1 text-sm"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Пароль</label>
          <input
            type="password"
            className="border rounded px-2 py-1 text-sm"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Добавить пользователя
        </button>
      </form>
    </>
  );
}
