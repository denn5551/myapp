import { useEffect, useState } from 'react'
import HeartIcon from './HeartIcon'

interface Props {
  agentId: string
  initialIsFavorite?: boolean
}

export default function FavoriteButton({ agentId, initialIsFavorite = false }: Props) {
  const [isFav, setIsFav] = useState(initialIsFavorite)

  useEffect(() => {
    if (initialIsFavorite) return
    fetch('/api/users/me/favorites', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const ids = (data.agents || []).map((a: any) => a.id)
        setIsFav(ids.includes(agentId))
      })
      .catch(console.error)
  }, [agentId, initialIsFavorite])

  const toggle = async () => {
    const method = isFav ? 'DELETE' : 'POST'
    try {
      await fetch(`/api/agents/by-id/${agentId}/favorite`, { method, credentials: 'include' })
      setIsFav(f => !f)
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
