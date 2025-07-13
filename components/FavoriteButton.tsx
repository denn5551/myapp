import { useEffect, useState } from 'react'
import HeartIcon from './HeartIcon'

interface Props {
  agentId: string
}

export default function FavoriteButton({ agentId }: Props) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/users/me/favorites', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setFavoriteIds((data.agents || []).map((a: any) => a.id)))
      .catch(console.error)
  }, [])

  const isFav = favoriteIds.includes(agentId)

  const toggle = async () => {
    const method = isFav ? 'DELETE' : 'POST'
    try {
      await fetch(`/api/agents/${agentId}/favorite`, { method, credentials: 'include' })
      setFavoriteIds(prev =>
        isFav ? prev.filter(id => id !== agentId) : [...prev, agentId]
      )
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <button className={`btn-heart ${isFav ? 'active' : ''}`} onClick={toggle}>
      <HeartIcon filled={isFav} />
    </button>
  )
}
