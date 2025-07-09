import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AgentCard from '@/components/AgentCard';

export default function CategoryPage() {
  const router = useRouter();
  const slug = router.query.name as string;
  const [category, setCategory] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/categories/${slug}`)
      .then(res => res.json())
      .then(data => {
        setCategory(data.category);
        setAgents(Array.isArray(data.agents) ? data.agents : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  console.log('Loaded agents for category:', agents);

  if (loading) {
    return (
      <Layout>
        <p>Загрузка…</p>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <p>Категория не найдена</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">{category.name}</h1>
      <div className="agents-grid">
        {agents.length === 0 ? (
          <p>Агенты не найдены</p>
        ) : (
          agents.map(agent => <AgentCard key={agent.id} {...agent} />)
        )}
      </div>
    </Layout>
  );
}
