// pages/agents/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function AgentsPage() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.email) {
          window.location.href = '/auth/login';
        } else {
          setEmail(data.email);
          setSubscriptionStatus(data.subscriptionStatus || 'expired');
          setLoading(false);
        }
      });

    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data.map((a: any) => ({
        ...a,
        categoryId: a.category_id,
        short: a.short_description,
        full: a.description
      }))))
      .catch(console.error);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <div className="content-header">
          <h1 className="section-title">Каталог ИИ-помощников</h1>

          {(subscriptionStatus === 'expired' || subscriptionStatus === 'trial') && (
            <div className="access-warning">
              <h3>🔓 Доступ ограничен</h3>
              <p>Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.</p>
            </div>
          )}
        </div>

        {categories.map(category => {
          const categoryAgents = agents.filter(agent => agent.categoryId === category.id);

          return (
            <section key={category.id} className="content-section">
              <div className="category-header">
                <h2 className="category-title">
                  <Link href={`/categories/${category.name}`} className="category-link">
                    {category.name}
                  </Link>
                </h2>
              </div>

              {categoryAgents.length === 0 ? (
                <p>Нет агентов в этой категории.</p>
              ) : (
                <>
                  <div className="agents-grid">
                    {categoryAgents.map(agent => (
                      <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                        <div className="agent-card">
                          <h3 className="agent-title">{agent.name}</h3>
                          <p className="agent-description">{agent.short}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="see-all-button-container">
                    <Link href={`/categories/${category.name}`} className="see-all-button">
                      Смотреть всех →
                    </Link>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
