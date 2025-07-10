import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';

interface Agent {
  id: string;
  name: string;
  short_description: string;
}

interface CategoryWithAgents {
  id: number;
  name: string;
  description?: string;
  agents: Agent[];
}

export default function AllCategories() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(o => !o);

  useEffect(() => {
    setSidebarOpen(window.innerWidth > 768);
  }, []);

  const [categories, setCategories] = useState<CategoryWithAgents[]>([]);
  useEffect(() => {
    fetch('/api/categories?page=1&perPage=999')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} userEmail="" subscriptionStatus="active" />

      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </header>

        <div className="content-section categories-section">
          <h2 className="section-title">Все категории</h2>
          <div className="categories-list">
            {categories.map(cat => (
              <section key={cat.id} className="category-block">
                <h3 className="category-title">{cat.name}</h3>
                <div className="agents-row">
                  {cat.agents.slice(0, 4).map(agent => (
                    <Link key={agent.id} href={`/agents/${agent.id}`} className="agent-card-link">
                      <div className="agent-card">
                        <h4 className="agent-title">{agent.name}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
