import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createDarkModeSlice, DarkModeSlice } from '@/store/useAppStore/dark-mode.slice';

export type AppSlices = DarkModeSlice;
export const useAppStore = create<AppSlices>()(
  immer((...a) => ({
    ...createDarkModeSlice(...a),
  })),
);
