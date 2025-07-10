import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import Pagination from '@/components/Pagination';

interface Agent {
  id: string;
  name: string;
  short_description: string;
  category_id?: number;
}

interface CategoryWithAgents {
  id: number;
  name: string;
  description?: string;
  agents: Agent[];
}

export default function AllCategories() {
  const router = useRouter();
  const page = parseInt((router.query.page as string) || '1');
  const perPage = parseInt((router.query.perPage as string) || '5');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');
  const [categories, setCategories] = useState<CategoryWithAgents[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [pageCount, setPageCount] = useState(1);

  const toggleSidebar = () => setSidebarOpen(o => !o);
  const toggleUserMenu = () => setUserMenuOpen(o => !o);

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

  useEffect(() => {
    fetch(`/api/categories?page=${page}&perPage=${perPage}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.categories) ? data.categories : [];
        setCategories(list);
        setPageCount(data.pageCount || 1);
      })
      .catch(() => {});
  }, [page, perPage]);

  // Load all agents for fallback mapping
  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : Array.isArray(data.agents) ? data.agents : [];
        setAllAgents(list);
      })
      .catch(() => {});
  }, []);

  const goToPage = (p: number) => {
    router.push(`/categories?page=${p}&perPage=${perPage}`);
  };
  const changePerPage = (n: number) => {
    router.push(`/categories?page=1&perPage=${n}`);
  };

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

  const firstIndex = (page - 1) * perPage;
  const lastIndex = firstIndex + perPage;
  const paginatedCategories = categories
    .slice(firstIndex, lastIndex)
    .map(cat => ({
      ...cat,
      agents: allAgents.filter(a => a.category_id === cat.id)
    }));

  return (
    <div className="dashboard-layout">
      <Sidebar
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        userEmail={email}
        subscriptionStatus={subscriptionStatus}
      />

      <main className="main-content with-sidebar p-6">
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
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

        <h1 className="section-title text-2xl font-bold mb-4">Все категории</h1>
        {subscriptionStatus !== 'active' && (
          <div className="access-warning">
            <h3>🔓 Доступ ограничен</h3>
            <p>Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.</p>
          </div>
        )}

        <section className="categories-grid">
          {paginatedCategories.map(category => (
            <div key={category.id} className="category-block">
              <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
              <div className="agents-grid">
                {category.agents.map(agent => (
                  <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                    <div className="agent-card">
                      <h4 className="agent-title">{agent.name}</h4>
                      <p className="agent-description">{agent.short_description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="pagination-controls">
          <Pagination
            page={page}
            pageCount={pageCount}
            perPage={perPage}
            onPageChange={goToPage}
            onPerPageChange={changePerPage}
          />
        </div>
      </main>
    </div>
  );
}
