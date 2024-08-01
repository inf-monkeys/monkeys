import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface AgentStore {
  agentId: string;
  setAgentId: (workflowId: string) => void;
}

const createAgentStore = () =>
  create<AgentStore>()(
    immer((set) => ({
      agentId: '',
      setAgentId: (agentId) => set({ agentId }),
    })),
  );

const { Provider: AgentStoreProvider, useStore: useAgentStore } = createContext<StoreApi<AgentStore>>();

export { AgentStoreProvider, createAgentStore, useAgentStore };
