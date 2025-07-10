import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';

export default function CategoryPage() {
  const router = useRouter();
  const name = router.query.name as string;
  const [category, setCategory] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(o => !o);

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
  }, []);

  useEffect(() => {
    if (!name) return;
    fetch(`/api/categories/${name}`)
      .then(res => res.json())
      .then(data => {
        setCategory(data.category);
        setAgents(Array.isArray(data.agents) ? data.agents : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [name]);

  console.log('Loaded agents for category:', agents);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} userEmail="" subscriptionStatus="trial" />
        <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <header className="lk-header">
            <button className="mobile-hamburger" onClick={toggleSidebar}>
              {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </header>
          <p>Загрузка…</p>
        </main>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="dashboard-layout">
        <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} userEmail="" subscriptionStatus="trial" />
        <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <header className="lk-header">
            <button className="mobile-hamburger" onClick={toggleSidebar}>
              {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </header>
          <p>Категория не найдена</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} userEmail="" subscriptionStatus="trial" />
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </header>
        <section className="content-section">
          <h2 className="section-title">{category.name}</h2>
          <div className="agents-grid">
            {agents.length > 0
              ? agents.map(agent => (
                  <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                    <div className="agent-card">
                      <h4>{agent.name}</h4>
                      <p>{agent.short_description}</p>
                    </div>
                  </Link>
                ))
              : <p>Агенты не найдены</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
