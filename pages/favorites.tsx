import Sidebar from '@/components/Sidebar'
import HamburgerIcon from '@/components/HamburgerIcon'
import CloseIcon from '@/components/CloseIcon'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSidebarState } from '@/hooks/useSidebarState'

interface Agent {
  id: string
  slug?: string
  name: string
  short_description: string
}

export default function FavoritesPage() {
  const [email, setEmail] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active'|'trial'|'expired'>('trial')
  const { sidebarOpen, toggleSidebar } = useSidebarState()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const [favoriteAgents, setFavoriteAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.email) {
          window.location.href = '/auth/login'
        } else {
          setEmail(data.email)
          setSubscriptionStatus(data.subscriptionStatus || 'expired')
        }
      })
  }, [])

  useEffect(() => {
    fetch('/api/users/me/favorites', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setFavoriteAgents(data.agents || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleUserMenu = () => setUserMenuOpen(!userMenuOpen)

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/logout', { credentials: 'include' })
      if (res.ok) {
        window.location.href = '/auth/login'
      }
    } catch (e) {
      console.error('Ошибка при выходе:', e)
    }
  }

  if (loading) return <div>Загрузка...</div>

  return (
    <div className="dashboard-layout">
      <Head><title>Избранные агенты</title></Head>
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
          <h1 className="header__title">Избранные агенты</h1>
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

        {(subscriptionStatus === 'expired' || subscriptionStatus === 'trial') && (
          <div className="access-warning">
            <h3>🔓 Доступ ограничен</h3>
            <p>Чтобы пользоваться всеми ИИ-помощниками без ограничений, оформите подписку.</p>
          </div>
        )}

        {favoriteAgents.length === 0 ? (
          <p>Нет избранных агентов.</p>
        ) : (
          <div className="agents-grid">
            {favoriteAgents.map(agent => (
              <Link key={agent.id} href={`/agents/${agent.slug || agent.id}`} className="agent-card-link">
                <div className="agent-card">
                  <h4 className="agent-title">{agent.name}</h4>
                  <p className="agent-description">{agent.short_description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
