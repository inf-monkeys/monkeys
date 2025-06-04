import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { IPinPage } from '@/apis/pages/typings';

interface ICurrentPageStore {
  currentPage: Partial<IPinPage>;
  setCurrentPage: (page: Partial<IPinPage>) => void;
}
export const useCurrentPageStore = create<ICurrentPageStore>()(
  persist(
    (set) => ({
      currentPage: {},
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'vines-ui-workbench-zustand-page',
    },
  ),
);

export const useCurrentPage = () => {
  return useCurrentPageStore((store) => store.currentPage);
};

export const useSetCurrentPage = () => {
  return useCurrentPageStore((store) => store.setCurrentPage);
};
