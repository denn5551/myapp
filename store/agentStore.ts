// store/agentStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Agent {
  id: string; // Внутренний ID для поиска (неизменяемый)
  openaiId: string; // OpenAI Assistant ID (редактируемый)
  slug: string; // slug для человекочитаемого URL
  name: string;
  description?: string;
  short: string;
  full: string;
  categoryId: number;
}

interface AgentStore {
  agents: Agent[];
  addAgent: (agent: Omit<Agent, 'id'>) => void; // ID генерируется автоматически
  updateAgent: (id: string, updates: Partial<Omit<Agent, 'id'>>) => void; // ID нельзя изменить
  deleteAgent: (id: string) => void;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set) => ({
      agents: [],
      addAgent: (agentData) =>
        set((state) => ({ 
          agents: [...state.agents, { 
            ...agentData, 
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Уникальный ID
          }] 
        })),
      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        })),
      deleteAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
        })),
    }),
    {
      name: 'agent-storage',
    }
  )
);