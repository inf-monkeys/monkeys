import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IOnlyShowWorkbenchIconStore {
  onlyShowWorkbenchIcon: boolean;
  setOnlyShowWorkbenchIcon: (onlyShowWorkbenchIcon: boolean) => void;
  toggleOnlyShowWorkbenchIcon: () => void;
  // 新增hover状态管理
  isHoveringGroup: boolean;
  setIsHoveringGroup: (isHovering: boolean) => void;
}

export const useOnlyShowWorkbenchIconStore = create<IOnlyShowWorkbenchIconStore>()(
  persist(
    (set) => ({
      onlyShowWorkbenchIcon: false,
      setOnlyShowWorkbenchIcon: (onlyShowWorkbenchIcon) => set({ onlyShowWorkbenchIcon }),
      toggleOnlyShowWorkbenchIcon: () => set((state) => ({ onlyShowWorkbenchIcon: !state.onlyShowWorkbenchIcon })),
      // 新增hover状态管理
      isHoveringGroup: false,
      setIsHoveringGroup: (isHoveringGroup) => set({ isHoveringGroup }),
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
// 新增hover状态hooks
export const useIsHoveringGroup = () => useOnlyShowWorkbenchIconStore((state) => state.isHoveringGroup);
export const useSetIsHoveringGroup = () => useOnlyShowWorkbenchIconStore((state) => state.setIsHoveringGroup);
