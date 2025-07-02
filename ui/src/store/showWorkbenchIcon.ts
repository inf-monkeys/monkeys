import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IOnlyShowWorkbenchIconStore {
  onlyShowWorkbenchIcon: boolean;
  setOnlyShowWorkbenchIcon: (onlyShowWorkbenchIcon: boolean) => void;
  toggleOnlyShowWorkbenchIcon: () => void;
}

export const useOnlyShowWorkbenchIconStore = create<IOnlyShowWorkbenchIconStore>()(
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
);
export const useOnlyShowWorkbenchIcon = () => useOnlyShowWorkbenchIconStore((state) => state.onlyShowWorkbenchIcon);
export const useSetOnlyShowWorkbenchIcon = () =>
  useOnlyShowWorkbenchIconStore((state) => state.setOnlyShowWorkbenchIcon);
export const useToggleOnlyShowWorkbenchIcon = () =>
  useOnlyShowWorkbenchIconStore((state) => state.toggleOnlyShowWorkbenchIcon);
