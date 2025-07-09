import React from 'react';
import Link from 'next/link';

interface Props {
  id: string;
  name: string;
  short_description: string;
}

export default function AgentCard({ id, name, short_description }: Props) {
  return (
    <div className="agent-card">
      <h4 className="agent-title">
        <Link href={`/agents/${id}`}>{name}</Link>
      </h4>
      <p className="agent-description">{short_description}</p>
    </div>
  );
}
