import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface IOnlyShowWorkbenchIconStore {
  onlyShowWorkbenchIcon: boolean;
  setOnlyShowWorkbenchIcon: (onlyShowWorkbenchIcon: boolean) => void;
  toggleOnlyShowWorkbenchIcon: () => void;
}

export const useOnlyShowWorkbenchIconStore = create<IOnlyShowWorkbenchIconStore>()(
  devtools(
    persist(
      (set) => ({
        onlyShowWorkbenchIcon: false,
        setOnlyShowWorkbenchIcon: (onlyShowWorkbenchIcon) => set({ onlyShowWorkbenchIcon }),
        toggleOnlyShowWorkbenchIcon: () => set((state) => ({ onlyShowWorkbenchIcon: !state.onlyShowWorkbenchIcon })),
      }),
      {
        name: 'onlyShowWorkbenchIcon',
      },
    ),
  ),
);
export const useOnlyShowWorkbenchIcon = () => useOnlyShowWorkbenchIconStore((state) => state.onlyShowWorkbenchIcon);
export const useShouldOnlyShowWorkbenchIcon = () =>
  useOnlyShowWorkbenchIconStore((state) => state.onlyShowWorkbenchIcon);
export const useToggleOnlyShowWorkbenchIcon = () =>
  useOnlyShowWorkbenchIconStore((state) => state.toggleOnlyShowWorkbenchIcon);
