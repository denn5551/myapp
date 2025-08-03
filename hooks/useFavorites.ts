import { useState, useEffect, useCallback, useMemo } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<{ id: string; name: string }[]>([])

  const load = useCallback(async () => {
    const res = await fetch('/api/users/me/favorites', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setFavorites(data.agents || [])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const favoriteIds = useMemo(() => favorites.map(f => f.id), [favorites])
  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds])

  const toggleFavorite = useCallback(
    async (agentId: string) => {
      const method = isFavorite(agentId) ? 'DELETE' : 'POST'
      const url = method === 'POST' ? '/api/favorites' : `/api/favorites/${agentId}`
      const opts: RequestInit = { method, credentials: 'include' }
      if (method === 'POST') {
        opts.headers = { 'Content-Type': 'application/json' }
        opts.body = JSON.stringify({ agentId })
      }
      await fetch(url, opts)
      await load()
    },
    [isFavorite, load]
  )

  return { favorites, isFavorite, toggleFavorite, loadFavorites: load }
}

