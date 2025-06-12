import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface IScrollPositionStore {
  scrollTops: Record<string, number>;
  setScrollTop: (workflowId: string, scrollTop: number) => void;
}
const useScrollPositionStore = create<IScrollPositionStore>()(
  devtools((set) => ({
    scrollTops: {},
    setScrollTop: (workflowId, scrollTop) =>
      set((store) => ({
        scrollTops: { ...store.scrollTops, [workflowId]: scrollTop },
      })),
  })),
);
export const useSetScrollTop = () => useScrollPositionStore((store) => store.setScrollTop);
export const useLastScrollTop = (workflowId: string) => useScrollPositionStore((s) => s.scrollTops[workflowId]);
