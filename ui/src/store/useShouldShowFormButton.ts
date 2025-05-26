import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShouldShowFormButtonStore {
  shouldShow: boolean;
  setShouldShowFormButtonOn: () => void;
  setShouldShowFormButtonOff: () => void;
}

export const useShouldShowFormButtonStore = create<ShouldShowFormButtonStore>()(
  persist(
    (set) => ({
      shouldShow: true,
      setShouldShowFormButtonOn: () => set({ shouldShow: true }),
      setShouldShowFormButtonOff: () => set({ shouldShow: false }),
    }),
    {
      name: 'show-form-buttons',
    },
  ),
);

export const useShouldShowFormButton = () => useShouldShowFormButtonStore((store) => store.shouldShow);
