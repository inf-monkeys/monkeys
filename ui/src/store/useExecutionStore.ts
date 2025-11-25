import { create, StoreApi } from 'zustand';
import { createContext } from 'zustand-utils';

interface IExecutionStore {
  status: 'idle' | 'running';
  setStatus: (status: 'idle' | 'running') => void;
}

const createExecutionStore = () =>
  create<IExecutionStore>()((set) => ({
    status: 'idle',
    setStatus: (status) =>
      set((state) =>
        state.status === status
          ? state
          : {
              status,
            },
      ),
  }));

const { Provider: ExecutionStoreProvider, useStore: useExecutionStore } = createContext<StoreApi<IExecutionStore>>();

export { createExecutionStore, ExecutionStoreProvider, useExecutionStore };
