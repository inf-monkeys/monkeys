import { IPageType } from '@/apis/pages/typings.ts';
import { ImmerStateCreator } from '@/store/typings.ts';

export interface PageSlice {
  page: IPageType | null;
  setPage: (page: IPageType) => void;

  containerWidth: number;
  setContainerWidth: (width: number) => void;
  containerHeight: number;
  setContainerHeight: (height: number) => void;

  visibleCustomSetting: boolean;
  setVisibleCustomSetting: (loading: boolean) => void;

  pageTitle: string;
}

export const createPageSlice: ImmerStateCreator<PageSlice> = (set) => ({
  page: null,
  setPage: (page) => set({ page, pageTitle: page.displayName }),
  containerWidth: 0,
  setContainerWidth: (containerWidth) => set({ containerWidth }),
  containerHeight: 0,
  setContainerHeight: (containerHeight) => set({ containerHeight }),
  visibleCustomSetting: false,
  setVisibleCustomSetting: (visibleCustomSetting) => set({ visibleCustomSetting }),
  pageTitle: '',
});
