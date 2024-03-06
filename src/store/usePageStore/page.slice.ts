import { IPageType } from '@/apis/pages/typings.ts';
import { ImmerStateCreator } from '@/store/typings.ts';

export interface PageSlice {
  page: IPageType | null;
  setPage: (page: IPageType) => void;

  visibleCustomSetting: boolean;
  setVisibleCustomSetting: (loading: boolean) => void;

  pageTitle: string;
}

export const createPageSlice: ImmerStateCreator<PageSlice> = (set) => ({
  page: null,
  setPage: (page) => set({ page, pageTitle: page.displayName }),
  visibleCustomSetting: false,
  setVisibleCustomSetting: (visibleCustomSetting) => set({ visibleCustomSetting }),
  pageTitle: '',
});
