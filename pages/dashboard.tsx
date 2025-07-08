// pages/dashboard.tsx
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';


const popularAgents = [
  {
    id: 'asst_jYPLYZOj82vtSYUviIOwAbRx',
    name: 'ИИ-психолог',
    description: 'Помогает справиться со стрессом и тревогой.',
  },
  {
    id: 'asst_2',
    name: 'Финансовый агент',
    description: 'Поможет с бюджетом и подушкой безопасности.',
  },
  {
    id: 'asst_3',
    name: 'Помощник по готовке',
    description: 'Подберёт рецепты из ваших продуктов.',
  },
  {
    id: 'asst_4',
    name: 'Фитнес-тренер',
    description: 'Составит план тренировок дома или в зале.',
  }
];



export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
     <Sidebar
  sidebarOpen={sidebarOpen}
  toggleSidebar={toggleSidebar}
  userEmail={email}
  subscriptionStatus={subscriptionStatus}
/>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <div className="content-header">
          <h2>Добро пожаловать!</h2>
          {(subscriptionStatus === 'expired' || subscriptionStatus === 'trial') && (
            <div className="access-warning">
              <h3>🔓 Доступ ограничен</h3>
              <p>Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.</p>
            </div>
          )}
          
          <Link href="/reset" className="reset-button">
            🔁 Сбросить подписку
          </Link>
        </div>

        <section className="content-section">
          <h3 className="section-title">Популярные помощники</h3>
          <div className="agents-grid">
            {popularAgents.map(agent => (
              <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                <div className="agent-card">
                  <h4 className="agent-title">{agent.name}</h4>
                  <p className="agent-description">{agent.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="content-section">
          <h3 className="section-title">📱 Мои помощники</h3>
          <p className="placeholder-text">(Раздел в разработке)</p>
        </section>
      </main>

 
    </div>
  );
}