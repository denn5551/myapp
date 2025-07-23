import { useEffect, useState, useMemo } from 'react';
import { useSidebarState } from '@/hooks/useSidebarState'
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
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const { sidebarOpen, toggleSidebar } = useSidebarState()
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired'>('trial');
  const [categories, setCategories] = useState<CategoryWithAgents[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);

  const toggleUserMenu = () => setUserMenuOpen(o => !o);

  // Initialize page and perPage from URL query
  useEffect(() => {
    if (router.isReady) {
      setPage(Number(router.query.page) || 1);
      setPerPage(Number(router.query.perPage) || 5);
    }
  }, [router.isReady]);

  // Keep URL in sync with current pagination
  useEffect(() => {
    if (router.isReady) {
      router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, page, perPage },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, page, perPage]);


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
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : Array.isArray(data.categories) ? data.categories : [];
        setCategories(list);
      })
      .catch(() => {});
  }, []);

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
    setPage(p);
  };
  const changePerPage = (n: number) => {
    setPerPage(n);
    setPage(1);
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

  const categoriesWithAgents = useMemo(
    () =>
      categories.map(cat => ({
        ...cat,
        agents: allAgents.filter(a => a.category_id === cat.id),
      })),
    [categories, allAgents]
  );

  const totalPages = Math.ceil(categoriesWithAgents.length / perPage);

  const paginatedCategories = useMemo(() => {
    const start = (page - 1) * perPage;
    return categoriesWithAgents.slice(start, start + perPage);
  }, [categoriesWithAgents, page, perPage]);

  return (
    <div className="dashboard-layout">
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
          <h1 className="header__title">Все категории</h1>
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
            pageCount={totalPages}
            perPage={perPage}
            onPageChange={goToPage}
            onPerPageChange={changePerPage}
          />
        </div>
      </main>
    </div>
  );
}
