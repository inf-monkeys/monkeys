import { create } from 'zustand';

export type GlobalViewSize = 'sm' | 'md' | 'lg';

interface IGlobalViewStore {
  size: GlobalViewSize;
  setSize: (size: GlobalViewSize) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const getInitialSize = (): GlobalViewSize => {
  if (typeof window === 'undefined') return 'lg';
  const width = window.innerWidth;
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  return 'lg';
};

export const useGlobalViewStore = create<IGlobalViewStore>((set) => ({
  size: getInitialSize(),
  setSize: (size) => set({ size }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));

export const useGlobalViewSize = () => useGlobalViewStore((state) => state.size);
export const useSetGlobalViewSize = () => useGlobalViewStore((state) => state.setSize);
export const useSidebarCollapsed = () => useGlobalViewStore((state) => state.sidebarCollapsed);
export const useToggleSidebar = () => useGlobalViewStore((state) => state.toggleSidebar);
export const useSetSidebarCollapsed = () => useGlobalViewStore((state) => state.setSidebarCollapsed);

export const initializeGlobalViewStore = () => {
  if (typeof window === 'undefined') return;

  const updateSize = () => {
    const width = window.innerWidth;
    const store = useGlobalViewStore.getState();
    let newSize: GlobalViewSize;

    if (width < 1024) {
      newSize = 'sm';
    } else if (width < 1600) {
      newSize = 'md';
    } else {
      newSize = 'lg';
    }

    if (store.size !== newSize) {
      store.setSize(newSize);
    }
  };

  let resizeTimer: NodeJS.Timeout;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateSize, 100);
  };

  window.addEventListener('resize', handleResize);

  // 初始化
  updateSize();

  // 返回清理函数
  return () => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimer);
  };
};
