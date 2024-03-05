import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createPageSlice, PageSlice } from '@/store/usePageStore/page.slice.ts';

export type PageSlices = PageSlice;
export const usePageStore = create<PageSlices>()(
  immer((...a) => ({
    ...createPageSlice(...a),
  })),
);
