import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IShouldFilterErrorStore {
  filter: boolean;
  setFilterOn: () => void;
  setFilterOff: () => void;
}

export const useShouldFilterErrorStore = create<IShouldFilterErrorStore>()(
  persist(
    (set) => ({
      filter: true,
      setFilterOn: () => set({ filter: true }),
      setFilterOff: () => set({ filter: false }),
    }),
    {
      name: 'filter-error',
    },
  ),
);

export const useShouldFilterError = () => useShouldFilterErrorStore((s) => s.filter);
