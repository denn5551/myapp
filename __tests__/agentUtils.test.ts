import { getAgentsByCategory, Agent } from '../lib/agentUtils';

describe('getAgentsByCategory', () => {
  const agents: Agent[] = [
    { id: 1, name: 'A', short_description: null, category_id: 1 },
    { id: 2, name: 'B', short_description: '', category_id: 1 },
    { id: 3, name: 'C', short_description: 'text', category_id: 1 },
    { id: 4, name: 'D', short_description: 'other', category_id: 2 },
  ];

  it('returns all agents for a category including null short_description', () => {
    const result = getAgentsByCategory(agents, 1);
    expect(result.length).toBe(3);
    expect(result.map(a => a.id)).toEqual([1, 2, 3]);
  });

  it('returns empty array for unknown category', () => {
    const result = getAgentsByCategory(agents, 99);
    expect(result).toEqual([]);
  });
});
