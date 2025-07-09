import React from 'react';

interface Props {
  id: number;
  name: string;
  description?: string;
  children?: React.ReactNode;
}

export default function CategoryCard({ name, description, children }: Props) {
  return (
    <div className="border p-4 rounded category-card">
      <h3 className="text-lg font-bold mb-2">{name}</h3>
      {description && <p className="text-sm mb-2">{description}</p>}
      {children}
    </div>
  );
}
