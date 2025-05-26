import { create } from 'zustand';

interface IShouldFilterErrorStore {
  filter: boolean;
  setFilterOn: () => void;
  setFilterOff: () => void;
}

export const useShouldFilterErrorStore = create<IShouldFilterErrorStore>((set) => ({
  filter: true,
  setFilterOn: () => set({ filter: true }),
  setFilterOff: () => set({ filter: false }),
}));
export const useShouldFilterError = () => useShouldFilterErrorStore((s) => s.filter);
