import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Category {
  id: number;
  name: string;
}

interface CategoryStore {
  categories: Category[];
  addCategory: (name: string) => void;
  renameCategory: (id: number, name: string) => void;
  deleteCategory: (id: number) => void;
}

export const useCategoryStore = create<CategoryStore>()(
  persist(
    (set) => ({
      categories: [
        { id: 1, name: 'Здоровье' },
        { id: 2, name: 'Финансы' },
        { id: 3, name: 'Образование' },
      ],
      addCategory: (name) =>
        set((state) => ({
          categories: [...state.categories, { id: Date.now(), name }],
        })),
      renameCategory: (id, name) =>
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, name } : cat
          ),
        })),
      deleteCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        })),
    }),
    {
      name: 'category-storage', // ключ в localStorage
    }
  )
);
