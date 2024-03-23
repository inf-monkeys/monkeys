import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface CanvasStore {
  canvasDisabled: boolean;
  setCanvasDisabled: (disabled: boolean) => void;
  isCanvasMoving: boolean;
  setCanvasMoving: (moving: boolean) => void;

  scale: number;
  setScale: (scale: number) => void;

  isUserInteraction: string | null;
  setIsUserInteraction: (isUserInteraction: string | null) => void;
}

const createCanvasStore = () =>
  create<CanvasStore>()(
    immer((set) => ({
      canvasDisabled: false,
      setCanvasDisabled: (canvasDisabled) => set({ canvasDisabled }),
      isCanvasMoving: false,
      setCanvasMoving: (isCanvasMoving) => set({ isCanvasMoving }),

      scale: 1.2,
      setScale: (scale) => set({ scale }),

      isUserInteraction: null,
      setIsUserInteraction: (isUserInteraction) => set({ isUserInteraction }),
    })),
  );

const { Provider: CanvasStoreProvider, useStore: useCanvasStore } = createContext<StoreApi<CanvasStore>>();

export { CanvasStoreProvider, createCanvasStore, useCanvasStore };
