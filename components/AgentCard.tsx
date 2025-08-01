import React from 'react';
import Link from 'next/link';
import FavoriteButton from './FavoriteButton';

interface Props {
  id: string;
  slug?: string;
  name: string;
  short_description: string;
}

export default function AgentCard({ id, slug, name, short_description }: Props) {
  return (
    <div className="agent-card">
      <h4 className="agent-title">
        <Link href={`/agents/${slug || id}`}>{name}</Link>
      </h4>
      <p className="agent-description">{short_description}</p>
      <FavoriteButton agentId={id} />
    </div>
  );
}
