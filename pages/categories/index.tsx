import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
  description: string;
}
interface Agent {
  id: string;
  name: string;
  short_description: string;
  category_id: number;
  display_on_main: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [pageCount, setPageCount] = useState(1);

  const loadCategories = async (p = page, pp = perPage) => {
    const res = await fetch(`/api/categories?page=${p}&perPage=${pp}`);
    const data = await res.json();
    setCategories(data.categories);
    setPageCount(data.pageCount);
  };

  useEffect(() => {
    loadCategories();
  }, [page, perPage]);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(setAgents)
      .catch(() => {});
  }, []);

  const agentsForCategory = (catId: number) => {
    const filtered = agents
      .filter(a => a.category_id === catId)
      .sort((a,b) => (a.display_on_main === b.display_on_main) ? 0 : a.display_on_main ? -1 : 1)
      .slice(0,4);
    return filtered;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 className="text-2xl mb-4">Все категории</h1>
      <div className="flex items-center gap-2 mb-2">
        <label>
          Показывать по{' '}
          <select
            className="border px-2 py-1 rounded"
            value={perPage}
            onChange={e => { setPage(1); setPerPage(+e.target.value); }}
          >
            {[5,10,15,25].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button
          className="px-2 py-1 border rounded"
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p-1))}
        >
          ‹
        </button>
        <span>Страница {page} из {pageCount}</span>
        <button
          className="px-2 py-1 border rounded"
          disabled={page >= pageCount}
          onClick={() => setPage(p => Math.min(pageCount, p+1))}
        >
          ›
        </button>
      </div>
      <ul className="space-y-6">
        {categories.map(cat => (
          <li key={cat.id} className="border p-4 rounded">
            <h3 className="text-lg font-bold mb-2">
              <Link href={`/categories/${cat.name}`}>{cat.name}</Link>
            </h3>
            <p className="text-sm mb-2">{cat.description}</p>
            <ul className="space-y-1 ml-4 list-disc">
              {agentsForCategory(cat.id).map(agent => (
                <li key={agent.id}>
                  <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
