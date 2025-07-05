 //components/Sidebar.tsx
 
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCategoryStore } from '@/store/categoryStore';
import { useState } from 'react';

interface SidebarProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  userEmail: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
}

export default function Sidebar({	
  sidebarOpen,
  toggleSidebar,
  userEmail,
  subscriptionStatus,
}: SidebarProps) {
  const router = useRouter();
  const { categories } = useCategoryStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

	const toggleUserMenu = () => {
	  setUserMenuOpen(prev => !prev);
	};

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        credentials: 'include'
      });
      if (response.ok) {
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>ИИ Помощники</h2>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
			<h4><a className="color" href="/dashboard">Главная</a></h4>
            <h4>Категории</h4>
            <ul className="sidebar-menu">			
              {categories.map(cat => (
				  <li key={cat.id} className="sidebar-menu-item">
					<Link href={`/categories/${cat.name}`} className="sidebar-link">
					  {cat.name}
					</Link>
				  </li>
				))}
			   <li className="sidebar-menu-item active">
                <Link href="/agents" className="sidebar-link sidebar-link-all">
                 📋 Смотреть все категории
                </Link>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h4>Избранные чаты</h4>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link href="#" className="sidebar-link">ИИ психолог</Link>
              </li>
              <li className="sidebar-menu-item">
                <Link href="#" className="sidebar-link">Фитнес тренер</Link>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h4>Последние Чаты</h4>
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link href="#" className="sidebar-link">ИИ психолог</Link>
              </li>
              <li className="sidebar-menu-item">
                <Link href="#" className="sidebar-link">Фитнес тренер</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="sidebar-footer">
          <Link href="/subscribe" className="subscribe-button">
            Оформить подписку
          </Link>
          
          <div className="user-info">
            <button className="user-info-button" onClick={toggleUserMenu}>
              <div className="user-avatar">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-email">{userEmail}</div>
                <div className={`subscription-badge ${subscriptionStatus}`}>
                  {subscriptionStatus === 'trial'
                    ? 'Пробный период'
                    : subscriptionStatus === 'active'
                      ? 'Активна'
                      : 'Истекла'}
                </div>
              </div>
              <div className="chevron">
                {userMenuOpen ? '▲' : '▼'}
              </div>
            </button>
            
            {userMenuOpen && (
              <div className="user-menu">
                <Link href="/settings" className="user-menu-item">
                  Настройки
                </Link>
                <Link href="/profile" className="user-menu-item">
                  Профиль
                </Link>
                <Link href="/help" className="user-menu-item">
                  Помощь
                </Link>
                <hr className="user-menu-separator" />
                <button onClick={handleLogout} className="user-menu-item">
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
  );
}
 
 