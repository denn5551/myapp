// pages/admin/agents.tsx
import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [newAgent, setNewAgent] = useState({
    openaiId: '',
    name: '',
    short: '',
    full: '',
    categoryId: 1,
  });

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (data.length > 0) {
          setNewAgent(a => ({ ...a, categoryId: data[0].id }));
        }
      })
      .catch(console.error);
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.map((a: any) => ({
        ...a,
        categoryId: a.category_id,
        openaiId: a.id,
        short: a.short_description,
        full: a.description
      }))))
      .catch(console.error);
  }, []);

  const handleAdd = async () => {
    if (!newAgent.openaiId || !newAgent.name) return;
    const res = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openaiId: newAgent.openaiId,
        name: newAgent.name,
        short: newAgent.short,
        full: newAgent.full,
        categoryId: newAgent.categoryId,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setAgents(prev => [...prev, { ...created, categoryId: created.category_id, openaiId: created.id, short: created.short_description, full: created.description }]);
      setNewAgent({ openaiId: '', name: '', short: '', full: '', categoryId: categories[0]?.id || 1 });
    }
  };

  const handleUpdate = async (id: string, updates: any) => {
    const res = await fetch('/api/agents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgents(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAgents(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <>
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
                  onChange={(e) => handleUpdate(agent.id, { name: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <select
                  className="w-full border px-2 py-1 rounded"
                  value={agent.categoryId}
                  onChange={(e) => handleUpdate(agent.id, { categoryId: +e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </td>
              <td className="border p-2">
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={agent.openaiId}
                  onChange={(e) => handleUpdate(agent.id, { openaiId: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <input
                  className="w-full border px-2 py-1 rounded"
                  value={agent.short}
                  onChange={(e) => handleUpdate(agent.id, { short: e.target.value })}
                />
              </td>
              <td className="border p-2">
                <textarea
                  className="w-full border px-2 py-1 rounded"
                  rows={2}
                  value={agent.full}
                  onChange={(e) => handleUpdate(agent.id, { full: e.target.value })}
                />
              </td>
              <td className="border p-2 text-center">
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDelete(agent.id)}
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
