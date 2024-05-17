import { create, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createContext } from 'zustand-utils';

export interface ViewStore {
  visible: boolean;
  setVisible: (visible: boolean) => void;

  fullscreen: boolean;
  setFullscreen: (fullscreen: boolean) => void;
}

const createViewStore = () =>
  create<ViewStore>()(
    immer((set) => ({
      visible: false,
      setVisible: (visible) => set({ visible }),

      fullscreen: false,
      setFullscreen: (fullscreen) => set({ fullscreen }),
    })),
  );

const { Provider: ViewStoreProvider, useStore: useViewStore } = createContext<StoreApi<ViewStore>>();

export { createViewStore, useViewStore, ViewStoreProvider };
