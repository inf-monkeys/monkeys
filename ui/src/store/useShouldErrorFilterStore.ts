import { create } from 'zustand';

export const useShouldErrorFilterStore = create<{
  filter: boolean;
  setFilterOn: () => void;
  setFilterOff: () => void;
}>((set) => ({
  filter: true,
  setFilterOn: () => set({ filter: true }),
  setFilterOff: () => set({ filter: false }),
}));
export const useShouldFilterError = () => useShouldErrorFilterStore((s) => s.filter);
