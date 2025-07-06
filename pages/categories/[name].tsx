// pages/categories/[name].tsx
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AgentPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [categoryAgents, setCategoryAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
const toggleSidebar = () => { setSidebarOpen(prev => !prev);
};

  useEffect(() => {
    if (router.isReady) {
      Promise.all([
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/agents').then(res => res.json())
      ]).then(([cats, ags]) => {
        const mappedAgents = ags.map((a: any) => ({
          ...a,
          categoryId: a.category_id,
          short: a.short_description,
          full: a.description
        }));
        setCategories(cats);
        setAgents(mappedAgents);

        const categoryName = Array.isArray(router.query.name) ? router.query.name[0] : router.query.name;
        const currentCategory = cats.find((c: any) => c.name === categoryName);
        const categoryId = currentCategory?.id;
        const filtered = mappedAgents.filter((ag: any) => ag.categoryId === categoryId);
        setCategoryAgents(filtered);
        setLoading(false);
      }).catch(err => {
        console.error('Data load error:', err);
        setLoading(false);
      });
    }
  }, [router.isReady, router.query.name]);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
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

  if (!router.isReady || loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Head>
        <title>Агенты категории</title>
      </Head>

          <Sidebar
  sidebarOpen={sidebarOpen}
  toggleSidebar={toggleSidebar}
  userEmail={email}
  subscriptionStatus={subscriptionStatus}  
/>

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'} p-6`}>
        <h1 className="text-2xl font-bold mb-6">Агенты категории</h1>
		
		 {(subscriptionStatus === 'expired' || subscriptionStatus === 'trial') && (
            <div className="access-warning">
              <h3>🔓 Доступ ограничен</h3>
              <p>Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.</p>
            </div>
          )}

        {categoryAgents.length === 0 && <p>Нет агентов в этой категории.</p>}

        <div className="agents-grid">
          {categoryAgents.map(agent => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
              <div className="agent-card">
                <h4 className="agent-title">{agent.name}</h4>
                <p className="agent-description">{agent.short}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
