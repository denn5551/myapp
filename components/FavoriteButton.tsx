import { useMemo } from 'react'
import { useFavorites } from '@/hooks/useFavorites'
import HeartIcon from './HeartIcon'

interface Props {
  agentId: string
  initialIsFavorite?: boolean
}

export default function FavoriteButton({ agentId, initialIsFavorite = false }: Props) {
  const { favorites, toggleFavorite } = useFavorites()

  const isFav = useMemo(() => {
    if (favorites.length === 0) return initialIsFavorite
    return favorites.some(f => f.id === agentId)
  }, [favorites, agentId, initialIsFavorite])

  return (
    <button className={`btn-heart ${isFav ? 'active' : ''}`} onClick={() => toggleFavorite(agentId)}>
      <HeartIcon filled={isFav} />
    </button>
  )
}

