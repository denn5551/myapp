// pages/admin/agents.tsx
import { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'disabled';
  usageCount: number;
  rating: number;
}

const initialAgents: Agent[] = [
  {
    id: 1,
    name: 'Бизнес-аналитик',
    description: 'Помогает анализировать бизнес-процессы и данные',
    category: 'Бизнес',
    status: 'active',
    usageCount: 150,
    rating: 4.5,
  },
  {
    id: 2,
    name: 'Код-ревьюер',
    description: 'Проверяет качество кода и дает рекомендации',
    category: 'Программирование',
    status: 'active',
    usageCount: 320,
    rating: 4.8,
  },
  {
    id: 3,
    name: 'Копирайтер',
    description: 'Создает тексты для контент-маркетинга',
    category: 'Творчество',
    status: 'disabled',
    usageCount: 89,
    rating: 4.2,
  },
];

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState(initialAgents);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    category: '',
  });

  const handleAdd = () => {
    if (newAgent.name && newAgent.description && newAgent.category) {
      setAgents(prev => [
        ...prev,
        {
          id: Math.max(...prev.map(a => a.id)) + 1,
          ...newAgent,
          status: 'active',
          usageCount: 0,
          rating: 0,
        },
      ]);
      setNewAgent({ name: '', description: '', category: '' });
    }
  };

  const handleStatusToggle = (id: number) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === id
          ? { ...agent, status: agent.status === 'active' ? 'disabled' : 'active' }
          : agent
      )
    );
  };

  const handleDelete = (id: number) => {
    setAgents(prev => prev.filter(agent => agent.id !== id));
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — ИИ-Агенты</title>
      </Head>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">ИИ-Агенты</h1>

        <div className="mb-6 grid grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Название"
            className="border rounded px-3 py-2"
            value={newAgent.name}
            onChange={e => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Описание"
            className="border rounded px-3 py-2"
            value={newAgent.description}
            onChange={e => setNewAgent(prev => ({ ...prev, description: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Категория"
            className="border rounded px-3 py-2"
            value={newAgent.category}
            onChange={e => setNewAgent(prev => ({ ...prev, category: e.target.value }))}
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
                <th className="border p-2 text-left">Категория</th>
                <th className="border p-2 text-center">Статус</th>
                <th className="border p-2 text-center">Использований</th>
                <th className="border p-2 text-center">Рейтинг</th>
                <th className="border p-2 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.id}>
                  <td className="border p-2">{agent.name}</td>
                  <td className="border p-2">{agent.description}</td>
                  <td className="border p-2">{agent.category}</td>
                  <td className="border p-2 text-center">
                    <button
                      className={`px-3 py-1 rounded text-sm ${
                        agent.status === 'active'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                      } text-white`}
                      onClick={() => handleStatusToggle(agent.id)}
                    >
                      {agent.status === 'active' ? 'Активен' : 'Отключен'}
                    </button>
                  </td>
                  <td className="border p-2 text-center">{agent.usageCount}</td>
                  <td className="border p-2 text-center">{agent.rating.toFixed(1)}</td>
                  <td className="border p-2 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleDelete(agent.id)}
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