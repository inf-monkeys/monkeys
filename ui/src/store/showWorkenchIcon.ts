import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface IOnlyShowWorkenchIconStore {
  onlyShowWorkenchIcon: boolean;
  setOnlyShowWorkenchIcon: (onlyShowWorkenchIcon: boolean) => void;
  toggleOnlyShowWorkenchIcon: () => void;
}

export const useOnlyShowWorkenchIconStore = create<IOnlyShowWorkenchIconStore>()(
  devtools(
    persist(
      (set) => ({
        onlyShowWorkenchIcon: false,
        setOnlyShowWorkenchIcon: (onlyShowWorkenchIcon) => set({ onlyShowWorkenchIcon }),
        toggleOnlyShowWorkenchIcon: () => set((state) => ({ onlyShowWorkenchIcon: !state.onlyShowWorkenchIcon })),
      }),
      {
        name: 'onlyShowWorkenchIcon',
      },
    ),
  ),
);
export const useOnlyShowWorkenchIcon = () => useOnlyShowWorkenchIconStore((state) => state.onlyShowWorkenchIcon);
export const useShouldOnlyShowWorkenchIcon = () => useOnlyShowWorkenchIconStore((state) => state.onlyShowWorkenchIcon);
export const useToggleOnlyShowWorkenchIcon = () =>
  useOnlyShowWorkenchIconStore((state) => state.toggleOnlyShowWorkenchIcon);
