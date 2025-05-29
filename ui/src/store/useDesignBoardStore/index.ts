import { Editor } from 'tldraw';
import { create, StoreApi } from 'zustand';
import { createContext } from 'zustand-utils';

export interface DesignBoardStore {
  designBoardId: string;
  setDesignBoardId: (designBoardId: string) => void;
  editor: Editor | null;
  setEditor: (editor: Editor) => void;
}

const createDesignBoardStore = () =>
  create<DesignBoardStore>()((set) => ({
    editor: null,
    setEditor: (editor) => set({ editor }),
    designBoardId: '',
    setDesignBoardId: (id) => set({ designBoardId: id }),
  }));

const { Provider: DesignBoardProvider, useStore: useDesignBoardStore } = createContext<StoreApi<DesignBoardStore>>();

export { createDesignBoardStore, DesignBoardProvider, useDesignBoardStore };

