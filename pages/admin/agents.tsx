// pages/admin/agents.tsx

import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';

// Копируем функцию slugify прямо сюда
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zа-я0-9-]/gi, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface Agent {
  id: string; // OpenAI Assistant ID (asst_...)
  name: string;
  slug: string;
  description: string;
  full_description: string;
  category_id: number;
  is_active: number;
  created_at?: string;
  updated_at?: string;
  category_name?: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Новый агент
  const [newAgent, setNewAgent] = useState<Partial<Agent>>({
    id: '', // OpenAI Assistant ID
    name: '',
    slug: '',
    description: '',
    full_description: '',
    category_id: 1,
    is_active: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(''); // Очищаем предыдущие ошибки
    
    const [agentsRes, categoriesRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/categories'), // Исправлено: было /api/agent-categories
    ]);

    // Проверяем статус ответов
    if (!agentsRes.ok) {
      throw new Error(`Ошибка API агентов: ${agentsRes.status} ${agentsRes.statusText}`);
    }
    if (!categoriesRes.ok) {
      throw new Error(`Ошибка API категорий: ${categoriesRes.status} ${categoriesRes.statusText}`);
    }

    // Проверяем тип контента перед парсингом
    const agentsContentType = agentsRes.headers.get('content-type');
    const categoriesContentType = categoriesRes.headers.get('content-type');
    
    if (!agentsContentType?.includes('application/json')) {
      const agentsText = await agentsRes.text();
      console.error('Ответ агентов не JSON:', agentsText);
      throw new Error('API агентов вернул не JSON ответ');
    }
    
    if (!categoriesContentType?.includes('application/json')) {
      const categoriesText = await categoriesRes.text();
      console.error('Ответ категорий не JSON:', categoriesText);
      throw new Error('API категорий вернул не JSON ответ');
    }

    const agentsData = await agentsRes.json();
    const categoriesData = await categoriesRes.json();

    setCategories(categoriesData.categories || []);
    setAgents(agentsData.agents || []);

    // Устанавливаем категорию по умолчанию для нового агента
    if ((categoriesData.categories?.length ?? 0) > 0) {
      setNewAgent(na => ({
        ...na,
        category_id: categoriesData.categories[0].id,
      }));
    }
  } catch (err) {
    console.error('Ошибка загрузки:', err);
    setError('Ошибка загрузки: ' + (err as Error).message);
  } finally {
    setLoading(false);
  }
};

  // Добавление агента
  const handleAdd = async () => {
    if (!newAgent.id || !newAgent.name) {
      setError('Укажите ID ассистента и название!');
      return;
    }
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAgent,
          slug: newAgent.slug || slugify(newAgent.name || ''),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка добавления агента');
      setNewAgent({
        id: '',
        name: '',
        slug: '',
        description: '',
        full_description: '',
        category_id: categories[0]?.id || 1,
        is_active: 1,
      });
      setError('');
      fetchData();
    } catch (err) {
      setError('Ошибка: ' + (err as Error).message);
    }
  };

  // Обновление агента (по одному полю)
  const handleUpdate = async (agent: Agent, field: string, value: any) => {
    try {
      const updated = { ...agent, [field]: value };
      if (field === 'name' && !updated.slug) {
        updated.slug = slugify(value);
      }
      const response = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка обновления');
      setAgents(prev =>
        prev.map(a => (a.id === agent.id ? { ...a, [field]: value } : a)),
      );
    } catch (err) {
      setError('Ошибка обновления: ' + (err as Error).message);
    }
  };

  // Удаление агента
  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить агента?')) return;
    try {
      const response = await fetch('/api/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка удаления');
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Ошибка удаления: ' + (err as Error).message);
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>Админка — Агенты</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">ИИ-Агенты</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}
      {/* Форма добавления */}
      <div className="card mb-6" style={{ maxWidth: 900 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <input
            className="border p-2 rounded"
            placeholder="OpenAI Assistant ID (asst_...)"
            value={newAgent.id}
            onChange={e => setNewAgent({ ...newAgent, id: e.target.value })}
          />
          <input
            className="border p-2 rounded"
            placeholder="Название"
            value={newAgent.name}
            onChange={e =>
              setNewAgent({
                ...newAgent,
                name: e.target.value,
                slug: slugify(e.target.value),
              })
            }
          />
          <input
            className="border p-2 rounded"
            placeholder="Slug"
            value={newAgent.slug || ''}
            onChange={e => setNewAgent({ ...newAgent, slug: e.target.value })}
          />
          <select
            className="border p-2 rounded"
            value={newAgent.category_id}
            onChange={e =>
              setNewAgent({ ...newAgent, category_id: +e.target.value })
            }
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            className="border p-2 rounded"
            placeholder="Краткое описание"
            value={newAgent.description}
            onChange={e => setNewAgent({ ...newAgent, description: e.target.value })}
          />
          <textarea
            className="border p-2 rounded"
            placeholder="Полное описание"
            rows={2}
            value={newAgent.full_description}
            onChange={e => setNewAgent({ ...newAgent, full_description: e.target.value })}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newAgent.is_active === 1}
              onChange={e =>
                setNewAgent({ ...newAgent, is_active: e.target.checked ? 1 : 0 })
              }
            />
            Активен
          </label>
          <button
            type="button"
            onClick={handleAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg shadow transition-colors duration-200"
            style={{ gridColumn: 'span 3' }}
          >
            + Добавить агента
          </button>
        </div>
      </div>
      {/* Список агентов */}
      <div className="space-y-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div>
                <input
                  className="border p-2 rounded w-full"
                  value={agent.id}
                  readOnly
                />
              </div>
              <div>
                <input
                  className="border p-2 rounded w-full"
                  value={agent.name}
                  onChange={e => handleUpdate(agent, 'name', e.target.value)}
                />
              </div>
              <div>
                <input
                  className="border p-2 rounded w-full"
                  value={agent.slug}
                  onChange={e => handleUpdate(agent, 'slug', e.target.value)}
                />
              </div>
              <div>
                <select
                  className="border p-2 rounded w-full"
                  value={agent.category_id}
                  onChange={e => handleUpdate(agent, 'category_id', +e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <input
                  className="border p-2 rounded w-full"
                  placeholder="Краткое описание"
                  value={agent.description || ''}
                  onChange={e => handleUpdate(agent, 'description', e.target.value)}
                />
                <textarea
                  className="border p-2 rounded w-full mt-2"
                  placeholder="Полное описание"
                  rows={2}
                  value={agent.full_description || ''}
                  onChange={e =>
                    handleUpdate(agent, 'full_description', e.target.value)
                  }
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={agent.is_active === 1}
                  onChange={e => handleUpdate(agent, 'is_active', e.target.checked ? 1 : 0)}
                />
                Активен
              </label>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg shadow"
                onClick={() => handleDelete(agent.id)}
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
      {agents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Агенты не найдены. Добавьте первого агента выше.
        </div>
      )}
    </AdminLayout>
  );
}
