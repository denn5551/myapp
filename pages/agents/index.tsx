import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [pageCount, setPageCount] = useState(1);

  const loadAgents = async (p = page, pp = perPage) => {
    const res = await fetch(`/api/agents?page=${p}&perPage=${pp}`);
    const data = await res.json();
    setAgents(data.agents);
    setPageCount(data.pageCount);
  };

  useEffect(() => {
    loadAgents();
  }, [page, perPage]);

  return (
    <div style={{ padding: '20px' }}>
      <h1 className="text-2xl mb-4">Все агенты</h1>
      <div className="flex items-center gap-2 mb-2">
        <label>
          Показывать по{' '}
          <select
            className="border px-2 py-1 rounded"
            value={perPage}
            onChange={(e) => { setPage(1); setPerPage(+e.target.value); }}
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
      <ul className="space-y-2">
        {agents.map(agent => (
          <li key={agent.id} className="border p-2 rounded">
            <Link href={`/agents/${agent.id}`}>{agent.name}</Link>
            <p className="text-sm text-gray-600">{agent.short_description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
