import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';

interface Agent {
  id: string;
  name: string;
  short_description: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const router = useRouter();
  const { name: slug } = router.query as { name?: string };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');

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
    fetch(`/api/categories/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error('Category not found');
        return r.json();
      })
      .then(data => {
        setCategory(data.category);
        setAgents(data.agents || []);
      })
      .catch(() => {
        setCategory(null);
        setAgents([]);
      });
  }, [slug]);

  console.log('Loaded agents for category:', agents);


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
          <div className="header__user" onClick={toggleUserMenu}>
            <span className="user-avatar">{email.charAt(0).toUpperCase()}</span>
            {userMenuOpen && (
              <ul className="dropdown-menu">
                <li><Link href="/profile">Профиль</Link></li>
                <li><button onClick={handleLogout}>Выйти</button></li>
              </ul>
            )}
          </div>
        </header>

        <div className="content-section">
          {category ? (
            <h2 className="section-title">{category.name}</h2>
          ) : (
            <h2 className="section-title">Загрузка категории…</h2>
          )}
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
        </div>
      </main>
    </div>
  );
}
