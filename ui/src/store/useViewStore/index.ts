import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface ViewStore {
  visible: boolean;
  from?: string;
  setVisible: (visible: boolean) => void;
  setFrom: (from?: string) => void;
}

const createViewStore = () =>
  create<ViewStore>()(
    immer((set) => ({
      visible: false,
      from: undefined,
      setVisible: (visible) => set({ visible }),
      setFrom: (from?) => set({ from }),
    })),
  );

const { Provider: ViewStoreProvider, useStore: useViewStore } = createContext<StoreApi<ViewStore>>();

export { createViewStore, useViewStore, ViewStoreProvider };
