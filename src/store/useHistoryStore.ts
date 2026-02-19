import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  id: string;
  toolName: string;
  input: string;
  output: string; // Can be text or URL
  type: 'text' | 'image' | 'video' | 'audio';
  timestamp: number;
}

interface HistoryState {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
  removeFromHistory: (id: string) => void;
  removeSelected: (ids: string[]) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addToHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
            },
            ...state.history,
          ],
        })),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
      removeSelected: (ids) =>
        set((state) => ({
          history: state.history.filter((item) => !ids.includes(item.id)),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'genztools-history',
    }
  )
);
