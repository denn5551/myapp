export interface Agent {
  id: string | number;
  name: string;
  short_description: string | null;
  description?: string | null;
  category_id: number;
}

export function getAgentsByCategory(agents: Agent[], categoryId: number): Agent[] {
  return agents.filter(a => a.category_id === categoryId);
}
