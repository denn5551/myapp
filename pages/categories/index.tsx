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

  const catsWithAgents = categories.map(cat => ({
    ...cat,
    agents: Array.isArray(cat.agents) && cat.agents.length > 0
      ? cat.agents
      : allAgents.filter(a => a.category_id === cat.id)
  }));

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

        <div className="content-section categories-section">
          <Pagination
            page={page}
            pageCount={pageCount}
            perPage={perPage}
            onPageChange={goToPage}
            onPerPageChange={changePerPage}
          />

          <section className="all-categories">
            {catsWithAgents.map(cat => (
              <div key={cat.id} className="category-column">
                <h2 className="category-title">{cat.name}</h2>
                <div className="agents-grid">
                  {cat.agents.map(agent => (
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
        </div>

        <Pagination
          page={page}
          pageCount={pageCount}
          perPage={perPage}
          onPageChange={goToPage}
          onPerPageChange={changePerPage}
        />
      </main>
    </div>
  );
}
