// pages/categories/[name].tsx
// Restored display logic from k2jylv-codex branch
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';

export default function AgentPage() {
  const router = useRouter();
  const categoryTitle = Array.isArray(router.query.name)
    ? router.query.name[0]
    : router.query.name || '';

  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
  }, []);


  const [categories, setCategories] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const [categoryAgents, setCategoryAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
const toggleSidebar = () => { setSidebarOpen(prev => !prev); };
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

  useEffect(() => {
    Promise.all([
      fetch('/api/categories', { credentials: 'include' })
        .then(res => {
          console.log('[categories] status:', res.status);
          return res.json();
        }),
      fetch('/api/agents', { credentials: 'include' })
        .then(res => {
          console.log('[agents] status:', res.status);
          return res.json();
        }),
    ])
      .then(([cats, ags]) => {
        console.log('Loaded categories:', cats);
        console.log('Loaded agents:', ags);
        setCategories(cats);
        setAgents(ags);
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  useEffect(() => {
    if (!router.isReady || !agents.length || !categories.length) return;

    const categoryName = Array.isArray(router.query.name)
      ? router.query.name[0]
      : router.query.name;
    console.log('Current slug:', categoryName);
    console.log('All categories:', categories);
    console.log('All agents:', agents);

  const currentCategory = categories.find(
    cat => cat.slug.toLowerCase() === String(categoryName).toLowerCase()
  );
    console.log('Matched category object:', currentCategory);

  const filtered = currentCategory
    ? agents.filter(agent => agent.category_id === currentCategory.id)
    : [];
    console.log('Filtered agents for render:', filtered);

    setCategoryAgents(filtered);
    setLoading(false);
  }, [router.isReady, agents, categories]);

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

  console.log('Agents for render:', categoryAgents);

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
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
          <h1 className="header__title">{categoryTitle}</h1>
          <div className="header__user" onClick={toggleUserMenu}>
            <span className="user-avatar">
              {email.charAt(0).toUpperCase()}
            </span>
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
        <h1 className="section-title text-2xl font-bold mb-6">{categoryTitle}</h1>
		
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
                <p className="agent-description">{agent.short_description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
