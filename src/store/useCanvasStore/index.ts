import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

export interface CanvasStore {
  visible: boolean;
  setVisible: (visible: boolean) => void;

  initialScale: number;
  setInitialScale: (scale: number) => void;

  canvasMode: CanvasStatus;
  isWorkflowRUNNING: boolean;
  setCanvasMode: (mode: CanvasStatus) => void;

  activeDraggableNodeId: string;
  setActiveDraggableNodeId: (activeDraggableNodeId: string) => void;
  overNodeId: string;
  setOverNodeId: (overNodeId: string) => void;

  disableDialogClose: boolean;
  setDisableDialogClose: (disable: boolean) => void;
}

const createCanvasStore = () =>
  create<CanvasStore>()(
    immer((set) => ({
      visible: false,
      setVisible: (visible) => set({ visible }),

      initialScale: 1.2,
      setInitialScale: (initialScale) => set({ initialScale }),

      canvasMode: CanvasStatus.EDIT,
      isWorkflowRUNNING: false,
      setCanvasMode: (canvasMode) =>
        set({
          canvasMode,
          isWorkflowRUNNING: [CanvasStatus.RUNNING, CanvasStatus.WAIT_TO_RUNNING].includes(canvasMode),
        }),

      activeDraggableNodeId: '',
      setActiveDraggableNodeId: (activeDraggableNodeId) => set({ activeDraggableNodeId }),
      overNodeId: '',
      setOverNodeId: (overNodeId) => set({ overNodeId }),

      disableDialogClose: false,
      setDisableDialogClose: (disableDialogClose) => set({ disableDialogClose }),
    })),
  );

const { Provider: CanvasStoreProvider, useStore: useCanvasStore } = createContext<StoreApi<CanvasStore>>();

export { CanvasStoreProvider, createCanvasStore, useCanvasStore };
