import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createDarkModeSlice, DarkModeSlice } from '@/store/useAppStore/dark-mode.slice';
import { createIconsSlice, IconsSlice } from '@/store/useAppStore/icons.slice.ts';
import { createImageOptimizeManageSlice } from '@/store/useAppStore/image-optimize-manage.ts';

export type AppSlices = DarkModeSlice & IconsSlice;
export const useAppStore = create<AppSlices>()(
  immer((...a) => ({
    ...createDarkModeSlice(...a),
    ...createIconsSlice(...a),
    ...createImageOptimizeManageSlice(...a),
  })),
);
