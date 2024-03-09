import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { CanvasSlice, createCanvasSlice } from '@/store/useFlowStore/canvas.slice.ts';

export type FlowSlices = CanvasSlice;
export const useFlowStore = create<FlowSlices>()(
  immer((...a) => ({
    ...createCanvasSlice(...a),
  })),
);
