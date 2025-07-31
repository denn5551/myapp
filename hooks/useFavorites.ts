import { useState, useEffect, useCallback } from 'react'

export function useFavorites() {
  const [favorites, setFavorites] = useState<{id:string,name:string}[]>([])
  const load = useCallback(async () => {
    const res = await fetch('/api/users/me/favorites', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      setFavorites(data.agents || [])
    }
  }, [])
  useEffect(() => { load() }, [load])
  const isFavorite = useCallback((id:string) =>
    favorites.some(f => f.id === id),
    [favorites]
  )
  const toggleFavorite = useCallback(async (agent:{id:string,name:string}) => {
    const method = isFavorite(agent.id) ? 'DELETE' : 'POST'
    await fetch(`/api/agents/by-id/${agent.id}/favorite`, { method, credentials: 'include' })
    await load()
  }, [isFavorite, load])
  return { favorites, isFavorite, toggleFavorite, loadFavorites: load }
}
