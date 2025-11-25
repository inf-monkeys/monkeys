import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface ViewStore {
  visible: boolean;
  from?: string;
  workspaceName?: string;
  setVisible: (visible: boolean) => void;
  setFrom: (from?: string) => void;
  setWorkspaceName: (workspaceName?: string) => void;
}

const createViewStore = () =>
  create<ViewStore>()(
    immer((set) => ({
      visible: false,
      from: undefined,
      workspaceName: undefined,
      setVisible: (visible) => set({ visible }),
      setFrom: (from?) => set({ from }),
      setWorkspaceName: (workspaceName?) => set({ workspaceName }),
    })),
  );

const { Provider: ViewStoreProvider, useStore: useViewStore } = createContext<StoreApi<ViewStore>>();

// 安全的 hook，如果不在 Provider 内不会报错
export const useViewStoreOptional = <T>(selector: (state: ViewStore | undefined) => T): T | undefined => {
  try {
    return useViewStore(selector);
  } catch {
    return undefined;
  }
};

export { createViewStore, useViewStore, ViewStoreProvider };
