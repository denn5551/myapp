import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CategoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');
  const router = useRouter();
  const slug = router.query.name as string;

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
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
        }
      });
  }, []);

  const toggleSidebar = () => setSidebarOpen(o => !o);
  const toggleUserMenu = () => setUserMenuOpen(o => !o);

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

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/categories/${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        console.log('Received category data:', data);
        setCategory(data.category);
        setAgents(data.agents || []);
      })
      .catch(err => {
        console.error('Error loading category:', err);
      });
  }, [slug]);

  if (!category) {
    return <p>Категория не найдена</p>;
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
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <h1 className="section-title">{category?.name || 'Загрузка…'}</h1>
          <div className="header__user" onClick={toggleUserMenu}>
            <span className="user-avatar">{email.charAt(0).toUpperCase()}</span>
            {userMenuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link href="/profile">Профиль</Link>
                </li>
                <li>
                  <button onClick={handleLogout}>Выйти</button>
                </li>
              </ul>
            )}
          </div>
        </header>

        <section className="content-section">
          {agents.length > 0 ? (
            <div className="agents-grid">
              {agents.map(agent => (
                <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                  <div className="agent-card">
                    <h4 className="agent-title">{agent.name}</h4>
                    <p className="agent-description">{agent.short_description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p>Нет агентов в этой категории.</p>
          )}
        </section>
      </main>
    </div>
  );
}
