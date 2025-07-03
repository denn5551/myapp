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

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Категории</h1>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Новая категория"
            className="border rounded px-3 py-2 flex-1 max-w-md"
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

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">Название</th>
                <th className="border p-2 text-center w-32">Агентов</th>
                <th className="border p-2 text-center w-32">Действия</th>
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
        </div>
      </div>
    </AdminLayout>
  );
}
