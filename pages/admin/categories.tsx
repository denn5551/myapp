// pages/admin/categories.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useCategoryStore } from '@/store/categoryStore';

export default function AdminCategoriesPage() {
  const { categories, addCategory, renameCategory, deleteCategory } = useCategoryStore();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim());
    setNewName('');
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
                  onChange={e => renameCategory(cat.id, e.target.value)}
                />
              </td>
              <td className="border p-2 text-center">—</td>
              <td className="border p-2 text-center">
                <button
                  onClick={() => deleteCategory(cat.id)}
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
