import { ImmerStateCreator } from '@/store/typings.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

export interface CanvasSlice {
  scale: number;
  setScale: (scale: number) => void;
  initialScale: number;
  setInitialScale: (scale: number) => void;

  canvasMode: CanvasStatus;
  setCanvasMode: (mode: CanvasStatus) => void;
  canvasDisabled: boolean;
  setCanvasDisabled: (disabled: boolean) => void;
  isCanvasMoving: boolean;
  setCanvasMoving: (moving: boolean) => void;

  isUserInteraction: string | null;
  setIsUserInteraction: (isUserInteraction: string | null) => void;

  zoomToNodeId: string;
  setZoomToNodeId: (zoomToNodeId: string) => void;
}

export const createCanvasSlice: ImmerStateCreator<CanvasSlice> = (set) => ({
  initialScale: 1.2,
  setInitialScale: (initialScale) => set({ initialScale }),
  scale: 1.2,
  setScale: (scale) => set({ scale }),

  canvasMode: CanvasStatus.EDIT,
  setCanvasMode: (canvasMode) => set({ canvasMode }),
  canvasDisabled: false,
  setCanvasDisabled: (canvasDisabled) => set({ canvasDisabled }),
  isCanvasMoving: false,
  setCanvasMoving: (isCanvasMoving) => set({ isCanvasMoving }),

  isUserInteraction: '',
  setIsUserInteraction: (isUserInteraction) => set({ isUserInteraction }),

  zoomToNodeId: '',
  setZoomToNodeId: (zoomToNodeId) => set({ zoomToNodeId }),
});
