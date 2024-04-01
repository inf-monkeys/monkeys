import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface FlowStore {
  isLatestWorkflowVersion: boolean;
  setIsLatestWorkflowVersion: (isLatestWorkflowVersion: boolean) => void;
}

const createFlowStore = () =>
  create<FlowStore>()(
    immer((set) => ({
      isLatestWorkflowVersion: true,
      setIsLatestWorkflowVersion: (isLatestWorkflowVersion) => set({ isLatestWorkflowVersion }),
    })),
  );

const { Provider: FlowStoreProvider, useStore: useFlowStore } = createContext<StoreApi<FlowStore>>();

export { createFlowStore, FlowStoreProvider, useFlowStore };
