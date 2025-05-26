import { create } from 'zustand';

interface ShouldShowFormButtonStore {
  shouldShow: boolean;
  setShouldShowFormButtonOn: () => void;
  setShouldShowFormButtonOff: () => void;
}

export const useShouldShowFormButtonStore = create<ShouldShowFormButtonStore>()((set) => ({
  shouldShow: true,
  setShouldShowFormButtonOn: () => set({ shouldShow: true }),
  setShouldShowFormButtonOff: () => set({ shouldShow: false }),
}));

export const useShouldShowFormButton = () => useShouldShowFormButtonStore((store) => store.shouldShow);
