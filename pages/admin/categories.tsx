// pages/admin/categories.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories).catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories(prev => [...prev, cat]);
      setNewName('');
    }
  };

  return (
    <>
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
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить
        </button>
      </div>

      <table className="w-full border-collapse table-auto text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Название</th>
            <th className="border p-2 text-center">Агентов</th>
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
                  onChange={async e => {
                    const res = await fetch('/api/categories', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: cat.id, name: e.target.value }),
                    });
                    if (res.ok) {
                      setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, name: e.target.value } : c)));
                    }
                  }}
                />
              </td>
              <td className="border p-2 text-center">—</td>
              <td className="border p-2 text-center">
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/categories?id=${cat.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      setCategories(prev => prev.filter(c => c.id !== cat.id));
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
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
