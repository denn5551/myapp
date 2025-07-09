import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import AgentCard from '@/components/AgentCard';

interface Category {
  id: number;
  name: string;
  slug: string;
}
interface Agent {
  id: string;
  name: string;
  short_description: string;
  category_id: number;
}

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [category, setCategory] = useState<Category | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!router.isReady || !slug) return;
    Promise.all([
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/agents').then(r => r.json()),
    ])
      .then(([cats, ags]) => {
        const list = Array.isArray(cats) ? cats : [];
        const cat = list.find((c: any) => c.slug === slug);
        setCategory(cat || null);
        const allAgents = Array.isArray(ags) ? ags : [];
        setAgents(cat ? allAgents.filter(a => a.category_id === cat.id) : []);
      })
      .catch(() => {
        setCategory(null);
        setAgents([]);
      });
  }, [router.isReady, slug]);

  if (!category) {
    return (
      <Layout>
        <p>Загрузка…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-2xl mb-4">{category.name}</h1>
      <div className="agents-grid">
        {agents.map(a => (
          <AgentCard key={a.id} {...a} />
        ))}
      </div>
    </Layout>
  );
}
