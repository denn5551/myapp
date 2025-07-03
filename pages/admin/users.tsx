// pages/admin/users.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useUserStore } from '@/store/userStore';
import type { User } from '@/store/userStore';

export default function AdminUsersPage() {
  const { users, setUsers } = useUserStore();
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) return;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([...users, data]);
        setNewUser({ email: '', password: '' });
      }
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Пользователи</title>
      </Head>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Пользователи</h1>

        {/* Форма добавления пользователя */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Пароль"
            className="border p-2 rounded"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          />
          <button
            onClick={handleAddUser}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Добавить пользователя
          </button>
        </div>

        {/* Таблица пользователей */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">ID</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Дата регистрации</th>
                <th className="border p-2 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="text-sm">
                  <td className="border p-2">{user.id}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
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
