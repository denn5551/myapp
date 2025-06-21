// pages/agents/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCategoryStore } from '@/store/categoryStore';
import { useAgentStore } from '@/store/agentStore';
import Sidebar from '@/components/Sidebar';

export default function AgentsPage() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { categories } = useCategoryStore();
  const { agents } = useAgentStore();

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  return (
    <div className="dashboard-layout">
	/* Sidebar */
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
          if (categoryAgents.length === 0) return null;

          return (
            <section key={category.id} className="content-section">
              <div className="category-header">
                <h2 className="category-title">
                  <Link href={`/categories/${category.name}`} className="category-link">
                    {category.name}
                  </Link>
                </h2>
              </div>

              <div className="agents-grid">
                {categoryAgents.slice(0, 4).map(agent => (
                  <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                    <div className="agent-card">
                      <h3 className="agent-title">{agent.name}</h3>
                      <p className="agent-description">{agent.short || agent.description}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="see-all-button-container mt-4">
                <Link href={`/categories/${category.name}`} className="see-all-button">
                  Смотреть всех →
                </Link>
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
