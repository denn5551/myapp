// pages/admin/agents.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { useAgentStore } from '@/store/agentStore';
import { useCategoryStore } from '@/store/categoryStore';

export default function AdminAgentsPage() {
  const { agents, addAgent, updateAgent, deleteAgent } = useAgentStore();
  const { categories } = useCategoryStore();

  const [newAgent, setNewAgent] = useState({
    openaiId: '', // Изменено с id на openaiId
    name: '',
    short: '',
    full: '',
    categoryId: categories[0]?.id || 1, // Используем существующую категорию
  });

  const handleAdd = () => {
    if (!newAgent.openaiId || !newAgent.name) return;
    addAgent(newAgent);
    setNewAgent({ 
      openaiId: '', 
      name: '', 
      short: '', 
      full: '', 
      categoryId: categories[0]?.id || 1 
    });
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Агенты</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">ИИ-Агенты</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          placeholder="OpenAI ID"
          value={newAgent.openaiId}
          onChange={(e) => setNewAgent({ ...newAgent, openaiId: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          placeholder="Название"
          value={newAgent.name}
          onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
        />
        <select
          className="border p-2 rounded"
          value={newAgent.categoryId}
          onChange={(e) => setNewAgent({ ...newAgent, categoryId: +e.target.value })}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          className="border p-2 rounded"
          placeholder="Краткое описание"
          value={newAgent.short}
          onChange={(e) => setNewAgent({ ...newAgent, short: e.target.value })}
        />
        <textarea
          className="border p-2 rounded col-span-full"
          placeholder="Полное описание"
          rows={3}
          value={newAgent.full}
          onChange={(e) => setNewAgent({ ...newAgent, full: e.target.value })}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить агента
        </button>
      </div>

      <table className="w-full table-auto border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">Название</th>
            <th className="border p-2">Категория</th>
            <th className="border p-2">OpenAI ID</th>
            <th className="border p-2">Кратко</th>
            <th className="border p-2">Полное описание</th>
            <th className="border p-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id}>
              <td className="border p-2">
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={agent.name}
                  onChange={(e) => updateAgent(agent.id, { name: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={agent.categoryId}
                  onChange={(e) => updateAgent(agent.id, { categoryId: +e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </td>
              <td className="border p-2">
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={agent.openaiId} // Изменено с agent.id на agent.openaiId
                  onChange={(e) => updateAgent(agent.id, { openaiId: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={agent.short}
                  onChange={(e) => updateAgent(agent.id, { short: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <textarea
                  className="w-full border px-2 py-1 rounded"
                  rows={2}
                  value={agent.full}
                  onChange={(e) => updateAgent(agent.id, { full: e.target.value })}
                />
              </td>
              <td className="border p-2 text-center">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteAgent(agent.id)}
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