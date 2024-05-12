import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { IPageType } from '@/apis/pages/typings.ts';

export interface PageSlice {
  page: IPageType | null;
  setPage: (page: IPageType | null) => void;

  containerWidth: number;
  setContainerWidth: (width: number) => void;
  containerHeight: number;
  setContainerHeight: (height: number) => void;

  visibleCustomSetting: boolean;
  setVisibleCustomSetting: (loading: boolean) => void;

  workbenchVisible: boolean;
  setWorkbenchVisible: (visible: boolean) => void;

  pageTitle: string;
}

export const usePageStore = create<PageSlice>()(
  immer((set) => ({
    page: null,
    setPage: (page) => set({ page, pageTitle: page?.displayName }),
    containerWidth: 0,
    setContainerWidth: (containerWidth) => set({ containerWidth }),
    containerHeight: 0,
    setContainerHeight: (containerHeight) => set({ containerHeight }),
    visibleCustomSetting: false,
    setVisibleCustomSetting: (visibleCustomSetting) => set({ visibleCustomSetting }),

    workbenchVisible: false,
    setWorkbenchVisible: (workbenchVisible) => set({ workbenchVisible }),

    pageTitle: '',
  })),
);
