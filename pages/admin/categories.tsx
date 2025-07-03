// pages/admin/categories.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

interface Category {
  id: number;
  name: string;
  description: string;
  agentsCount: number;
}

const initialCategories: Category[] = [
  {
    id: 1,
    name: 'Бизнес',
    description: 'Агенты для бизнес-задач',
    agentsCount: 5,
  },
  {
    id: 2,
    name: 'Программирование',
    description: 'Помощники в разработке',
    agentsCount: 8,
  },
  {
    id: 3,
    name: 'Творчество',
    description: 'Креативные ассистенты',
    agentsCount: 3,
  },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  const handleAdd = () => {
    if (newCategory.name && newCategory.description) {
      setCategories(prev => [
        ...prev,
        {
          id: Math.max(...prev.map(c => c.id)) + 1,
          ...newCategory,
          agentsCount: 0,
        },
      ]);
      setNewCategory({ name: '', description: '' });
    }
  };

  const handleDelete = (id: number) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Категории</title>
      </Head>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Категории</h1>

        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Название"
            className="border rounded px-3 py-2 flex-1"
            value={newCategory.name}
            onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Описание"
            className="border rounded px-3 py-2 flex-1"
            value={newCategory.description}
            onChange={e => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
          />
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleAdd}
          >
            Добавить
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left">Название</th>
                <th className="border p-2 text-left">Описание</th>
                <th className="border p-2 text-center">Агентов</th>
                <th className="border p-2 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td className="border p-2">{category.name}</td>
                  <td className="border p-2">{category.description}</td>
                  <td className="border p-2 text-center">{category.agentsCount}</td>
                  <td className="border p-2 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleDelete(category.id)}
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