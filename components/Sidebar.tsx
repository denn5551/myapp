 //components/Sidebar.tsx
 
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

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
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState<boolean>(true);
  const [favoritesOpen, setFavoritesOpen] = useState<boolean>(true);
  const [isRecentOpen, setRecentOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    const savedCats = localStorage.getItem('sidebarCategoriesOpen');
    if (savedCats !== null) setCategoriesOpen(JSON.parse(savedCats));
    const savedFavs = localStorage.getItem('sidebarFavoritesOpen');
    if (savedFavs !== null) setFavoritesOpen(JSON.parse(savedFavs));
  }, []);

  const toggleCategories = () => {
    setCategoriesOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCategoriesOpen', JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorites = () => {
    setFavoritesOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebarFavoritesOpen', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/users/me/favorites', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFavorites(data.agents || []))
      .catch(console.error)
  }, [])

  async function loadMore() {
    const res = await fetch(
      `/api/users/me/recent?limit=10${cursor ? `&cursor=${cursor}` : ''}`,
      { credentials: 'include' }
    )
    const { chats, nextCursor } = await res.json()
    setRecentChats(prev => [...prev, ...chats])
    setCursor(nextCursor)
  }

  useEffect(() => { loadMore() }, [])

  function handleScroll(e: React.UIEvent<HTMLUListElement>) {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && cursor) {
      loadMore()
    }
  }

  useEffect(() => {
    console.log('Sidebar categories:', categories);
  }, [categories]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay show" onClick={toggleSidebar}></div>
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <h2>ИИ Помощники</h2>
          </div>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isMobile && sidebarOpen ? '✕' : sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <Link href="/dashboard" className="sidebar-link">
              <span className="sidebar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"/></svg>
              </span>
              <span className="link-text">Главная</span>
            </Link>
          </div>

          <div className="sidebar-section">
            <button className="accordion-trigger" onClick={toggleCategories}>
              <span className="sidebar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z"/></svg>
              </span>
              <span className="link-text">Категории</span>
              <span className={`accordion-arrow ${categoriesOpen ? 'open' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 6l4 4 4-4"/></svg>
              </span>
            </button>
            {categoriesOpen && (
              <ul className="sidebar-menu">
                {categories.map(cat => (
                  <li key={cat.id} className="sidebar-menu-item">
                    <Link href={`/categories/${cat.slug}`} className="sidebar-link">
                      <span className="sidebar-icon" />
                      <span className="link-text">{cat.name}</span>
                    </Link>
                  </li>
                ))}
                <li className="sidebar-menu-item active">
                  <Link href="/categories" className="sidebar-link sidebar-link-all">
                    <span className="sidebar-icon" />
                    <span className="link-text">Смотреть все категории</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className="sidebar-section">
            <button className="accordion-trigger" onClick={toggleFavorites}>
              <span className="sidebar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 10.19 8.63 3 9.24l5.46 4.73L6.82 21z"/></svg>
              </span>
              <span className="link-text">Избранные чаты</span>
              <span className={`accordion-arrow ${favoritesOpen ? 'open' : ''}`}>
                <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 6l4 4 4-4"/></svg>
              </span>
            </button>
            {favoritesOpen && (
              <ul className="sidebar-menu">
                {favorites.slice(0,5).map(a => (
                  <li key={a.id} className="sidebar-menu-item">
                    <Link href={`/agents/${a.id}`} className="sidebar-link">
                      <span className="link-text">{a.name}</span>
                    </Link>
                  </li>
                ))}
                <li className="sidebar-menu-item active">
                  <Link href="/favorites" className="sidebar-link sidebar-link-all">
                    <span className="link-text">Смотреть все</span>
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <div className="sidebar-section recent-chats-section">
            <button className="accordion-trigger" onClick={() => setRecentOpen(!isRecentOpen)}>
              <span className="sidebar-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6a6 6 0 106 6H12V6zm-7.5 6a7.5 7.5 0 1112.9 5.3l1.6 1.6a.75.75 0 11-1.06 1.06l-1.6-1.6A7.5 7.5 0 014.5 12z"/></svg>
              </span>
              {sidebarOpen && (
                <>
                  <span className="link-text">Последние чаты</span>
                  <span className={`accordion-arrow ${isRecentOpen ? 'open' : ''}`}>
                    <svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 6l4 4 4-4"/></svg>
                  </span>
                </>
              )}
            </button>
            {sidebarOpen && isRecentOpen && (
              <ul className="recent-chats-list" onScroll={handleScroll}>
                {recentChats.map(chat => (
                  <Link href={`/agents/${chat.chat_id}`} key={chat.chat_id}>
                    <div className="recent-chat-item">
                      <div className="chat-title">{chat.title}</div>
                      <div className="chat-date">{chat.last_message_at}</div>
                    </div>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <Link href="/subscribe" className="subscribe-button">
            Оформить подписку
          </Link>
        </div>
      </aside>
    </>
  );
}
  