// pages/agents/index.tsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';

export default function AgentsPage() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
  }, []);


  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/agents').then((r) => r.json()),
    ])
      .then(([cats, ags]) => {
        setCategories(cats);
        setAgents(ags);
      })
      .catch(() => {});
  }, []);

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
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', { credentials: 'include' });
      if (res.ok) {
        window.location.href = '/auth/login';
      }
    } catch (e) {
      console.error('Ошибка при выходе:', e);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  console.log('Agents for render:', agents);

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <div className="lk-header__profile">
            <button className="user-info-button" onClick={toggleUserMenu}>
              <div className="profile-avatar">{email.charAt(0).toUpperCase()}</div>
              <div className="chevron">{userMenuOpen ? '▲' : '▼'}</div>
            </button>
            {userMenuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link href="/settings">Настройки</Link>
                </li>
                <li>
                  <Link href="/profile">Профиль</Link>
                </li>
                <li>
                  <Link href="/help">Помощь</Link>
                </li>
                <li>
                  <button onClick={handleLogout}>Выйти</button>
                </li>
              </ul>
            )}
          </div>
        </header>
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
          const categoryAgents = agents.filter(agent => agent.category_id === category.id);

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
                          <p className="agent-description">{agent.short_description}</p>
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
