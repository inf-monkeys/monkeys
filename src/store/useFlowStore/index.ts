import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

export interface FlowStore {
  workflowId: string;
  setWorkflowId: (workflowId: string) => void;

  isLatestWorkflowVersion: boolean;
  setIsLatestWorkflowVersion: (isLatestWorkflowVersion: boolean) => void;

  visible: boolean;
  setVisible: (visible: boolean) => void;

  scale: number;
  setScale: (scale: number) => void;
  initialScale: number;
  setInitialScale: (scale: number) => void;

  canvasMode: CanvasStatus;
  isWorkflowRUNNING: boolean;
  setCanvasMode: (mode: CanvasStatus) => void;

  canvasDisabled: boolean;
  setCanvasDisabled: (disabled: boolean) => void;
  isCanvasMoving: boolean;
  setCanvasMoving: (moving: boolean) => void;

  isUserInteraction: string | null;
  setIsUserInteraction: (isUserInteraction: string | null) => void;

  zoomToNodeId: string;
  setZoomToNodeId: (zoomToNodeId: string) => void;

  activeDraggableNodeId: string;
  setActiveDraggableNodeId: (activeDraggableNodeId: string) => void;
  overNodeId: string;
  setOverNodeId: (overNodeId: string) => void;

  disableDialogClose: boolean;
  setDisableDialogClose: (disable: boolean) => void;
}

const createFlowStore = () =>
  create<FlowStore>()(
    immer((set) => ({
      workflowId: '',
      setWorkflowId: (workflowId) => set({ workflowId }),

      isLatestWorkflowVersion: true,
      setIsLatestWorkflowVersion: (isLatestWorkflowVersion) => set({ isLatestWorkflowVersion }),

      visible: false,
      setVisible: (visible) => set({ visible }),

      initialScale: 1.2,
      setInitialScale: (initialScale) => set({ initialScale }),
      scale: 1.2,
      setScale: (scale) => set({ scale }),

      canvasMode: CanvasStatus.EDIT,
      isWorkflowRUNNING: false,
      setCanvasMode: (canvasMode) =>
        set({
          canvasMode,
          isWorkflowRUNNING: [CanvasStatus.RUNNING, CanvasStatus.WAIT_TO_RUNNING].includes(canvasMode),
        }),
      canvasDisabled: false,
      setCanvasDisabled: (canvasDisabled) => set({ canvasDisabled }),
      isCanvasMoving: false,
      setCanvasMoving: (isCanvasMoving) => set({ isCanvasMoving }),

      isUserInteraction: '',
      setIsUserInteraction: (isUserInteraction) => set({ isUserInteraction }),

      zoomToNodeId: '',
      setZoomToNodeId: (zoomToNodeId) => set({ zoomToNodeId }),

      activeDraggableNodeId: '',
      setActiveDraggableNodeId: (activeDraggableNodeId) => set({ activeDraggableNodeId }),
      overNodeId: '',
      setOverNodeId: (overNodeId) => set({ overNodeId }),

      disableDialogClose: false,
      setDisableDialogClose: (disableDialogClose) => set({ disableDialogClose }),
    })),
  );

const { Provider: FlowStoreProvider, useStore: useFlowStore } = createContext<StoreApi<FlowStore>>();

export { createFlowStore, FlowStoreProvider, useFlowStore };
