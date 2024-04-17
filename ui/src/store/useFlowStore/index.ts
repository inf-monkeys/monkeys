import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface FlowStore {
  workflowId: string;
  setWorkflowId: (workflowId: string) => void;

  isLatestWorkflowVersion: boolean;
  setIsLatestWorkflowVersion: (isLatestWorkflowVersion: boolean) => void;
}

const createFlowStore = () =>
  create<FlowStore>()(
    immer((set) => ({
      workflowId: '',
      setWorkflowId: (workflowId) => set({ workflowId }),

      isLatestWorkflowVersion: true,
      setIsLatestWorkflowVersion: (isLatestWorkflowVersion) => set({ isLatestWorkflowVersion }),
    })),
  );

const { Provider: FlowStoreProvider, useStore: useFlowStore } = createContext<StoreApi<FlowStore>>();

export { createFlowStore, FlowStoreProvider, useFlowStore };
