import React from 'react';
import Link from 'next/link';
import HeartIcon from './HeartIcon';
import { useFavorites } from '@/hooks/useFavorites';

interface Props {
  id: string;
  name: string;
  short_description: string;
}

export default function AgentCard({ id, name, short_description }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const agent = { id, name };
  return (
    <div className="agent-card">
      <h4 className="agent-title">
        <Link href={`/agents/${id}`}>{name}</Link>
      </h4>
      <p className="agent-description">{short_description}</p>
      <button
        className={`btn-heart ${isFavorite(id) ? 'active' : ''}`}
        onClick={() => toggleFavorite(agent)}
      >
        <HeartIcon />
      </button>
    </div>
  );
}
