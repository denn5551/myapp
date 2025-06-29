import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function CategoriesPage() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [agentsByCat, setAgentsByCat] = useState<Record<number, any[]>>({});
  const [page, setPage] = useState(0); // number of extra pages loaded
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (!data.email) {
          window.location.href = '/auth/login';
        } else {
          setEmail(data.email);
          setSubscriptionStatus(data.subscriptionStatus || 'expired');
        }
      });
  }, []);

  useEffect(() => {
    loadInitial();
  }, []);

  const loadInitial = async () => {
    const res = await fetch('/api/categories?limit=5&offset=0');
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(cats);
    for (const cat of cats) {
      await loadAgents(cat.id, 8);
    }
    setLoading(false);
  };

  const loadAgents = async (categoryId: number, limit = 8) => {
    const res = await fetch(`/api/agents?categoryId=${categoryId}&limit=${limit}`);
    const data = await res.json();
    setAgentsByCat(prev => ({ ...prev, [categoryId]: data.agents || [] }));
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const offset = 5 + page * 10;
    const res = await fetch(`/api/categories?limit=10&offset=${offset}`);
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(prev => [...prev, ...cats]);
    for (const cat of cats) {
      await loadAgents(cat.id, 8);
    }
    setPage(prev => prev + 1);
    if (cats.length === 0) setHasMore(false);
    setLoadingMore(false);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'} p-6`}>
        <h1 className="text-2xl font-bold mb-6">Категории</h1>

        {loading ? (
          <div>Загрузка...</div>
        ) : (
          categories.map(cat => (
            <section key={cat.id} className="mb-8">
              <h2 className="text-xl font-semibold mb-3">
                <Link href={`/categories/${cat.name}`}>{cat.name}</Link>
              </h2>
              <div className="agents-grid">
                {(agentsByCat[cat.id] || []).map(agent => (
                  <Link key={agent.id} href={`/agents/${agent.slug}`} className="agent-card-link">
                    <div className="agent-card">
                      <h3 className="agent-title">{agent.name}</h3>
                      <p className="agent-description">{agent.short_description || agent.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}

        {hasMore && (
          <div className="text-center mt-4">
            <button onClick={loadMore} disabled={loadingMore} className="see-all-button">
              {loadingMore ? 'Загрузка...' : 'Показать ещё'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
