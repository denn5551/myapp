import React from 'react';

interface Props {
  id: string;
  name: string;
  short_description: string;
}

export default function AgentCard({ name, short_description }: Props) {
  return (
    <div className="agent-card">
      <h4 className="agent-title">{name}</h4>
      <p className="agent-description">{short_description}</p>
    </div>
  );
}
