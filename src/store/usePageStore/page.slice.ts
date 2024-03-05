import { IPageType } from '@/apis/pages/typings.ts';
import { ImmerStateCreator } from '@/store/typings.ts';

export interface PageSlice {
  page: IPageType | null;
  setPage: (page: IPageType) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  pageTitle: string;
}

export const createPageSlice: ImmerStateCreator<PageSlice> = (set) => ({
  page: null,
  setPage: (page) => set({ page, pageTitle: page.displayName }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  pageTitle: '',
});
