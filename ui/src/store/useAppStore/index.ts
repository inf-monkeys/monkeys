import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createDarkModeSlice, DarkModeSlice } from '@/store/useAppStore/dark-mode.slice';
import { createIconsSlice, IconsSlice } from '@/store/useAppStore/icons.slice.ts';

export type AppSlices = DarkModeSlice & IconsSlice;
export const useAppStore = create<AppSlices>()(
  immer((...a) => ({
    ...createDarkModeSlice(...a),
    ...createIconsSlice(...a),
  })),
);
