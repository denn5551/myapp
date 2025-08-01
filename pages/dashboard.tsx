// pages/dashboard.tsx
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSidebarState } from '@/hooks/useSidebarState'
import Sidebar from '@/components/Sidebar';
import HamburgerIcon from '@/components/HamburgerIcon';
import CloseIcon from '@/components/CloseIcon';
import { WelcomePopup } from '@/components/WelcomePopup';


interface Agent {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  full_description?: string;
}



export default function Dashboard() {
  const [email, setEmail] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'trial' | 'expired'>('trial');
  const { sidebarOpen, toggleSidebar } = useSidebarState()
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [popularAgents, setPopularAgents] = useState<Agent[]>([]);


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
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(data => setPopularAgents(data.agents || []))
      .catch(() => {});
  }, []);


  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
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

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
     <Sidebar
  sidebarOpen={sidebarOpen}
  toggleSidebar={toggleSidebar}
  userEmail={email}
  subscriptionStatus={subscriptionStatus}
/>

      <WelcomePopup />

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
        <header className="lk-header">
          <button className="mobile-hamburger" onClick={toggleSidebar}>
            {sidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
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
              <Link key={agent.id} href={`/agents/${agent.slug || agent.id}`} className="agent-card-link">
                <div className="agent-card">
                  <h4 className="agent-title">{agent.name}</h4>
                  <p className="agent-description">{agent.short_description}</p>
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
  );}
