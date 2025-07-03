import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  created_at: string;
  password: string;
}

interface UserStore {
  users: User[];
  setUsers: (users: User[]) => void;
  updateUser: (id: number, updates: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      users: [],
      setUsers: (users) => set({ users }),
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
        })),
      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        })),
    }),
    {
      name: 'user-storage',
    }
  )
); 