// pages/admin/categories.ts

import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // Получаем категории из базы при загрузке страницы
  const fetchCategories = async () => {
    setLoading(true);
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Добавить категорию
  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc }),
    });
    setNewName('');
    setNewDesc('');
    fetchCategories();
  };

  // Переименовать категорию
  const handleRename = async (id, name, description) => {
    await fetch('/api/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, description }),
    });
    fetchCategories();
  };

  // Удалить категорию
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить категорию?')) return;
    await fetch('/api/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchCategories();
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Категории</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Категории</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Новая категория"
          className="border px-3 py-2 rounded w-64"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Описание"
          className="border px-3 py-2 rounded w-64"
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить
        </button>
      </div>

      {loading && <div className="mb-2 text-gray-500">Загрузка...</div>}

      <table className="w-full border-collapse table-auto text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Название</th>
            <th className="border p-2 text-left">Описание</th>
            <th className="border p-2 text-center">Действия</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td className="border p-2">
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={cat.name}
                  onChange={e => handleRename(cat.id, e.target.value, cat.description)}
                />
              </td>
              <td className="border p-2">
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  value={cat.description || ''}
                  onChange={e => handleRename(cat.id, cat.name, e.target.value)}
                />
              </td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
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

