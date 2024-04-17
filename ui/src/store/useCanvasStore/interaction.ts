import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface CanvasInteractionStore {
  canvasDisabled: boolean;
  setCanvasDisabled: (disabled: boolean) => void;
  isCanvasMoving: boolean;
  setCanvasMoving: (moving: boolean) => void;

  scale: number;
  setScale: (scale: number) => void;

  isUserInteraction: string | null;
  setIsUserInteraction: (isUserInteraction: string | null) => void;
}

const createCanvasInteractionStore = () =>
  create<CanvasInteractionStore>()(
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

const { Provider: CanvasInteractionStoreProvider, useStore: useCanvasInteractionStore } =
  createContext<StoreApi<CanvasInteractionStore>>();

export { CanvasInteractionStoreProvider, createCanvasInteractionStore, useCanvasInteractionStore };
