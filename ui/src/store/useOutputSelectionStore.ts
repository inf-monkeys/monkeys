import { create, StoreApi } from 'zustand';
import { createContext } from 'zustand-utils';

import { IVinesExecutionResultItem } from '@/utils/execution';

interface IOutputSelectionStore {
  isSelectionMode: boolean;
  selectedOutputs: Set<string>;
  selectedOutputItems: IVinesExecutionResultItem[];
  setSelectionMode: (mode: boolean) => void;
  toggleOutputSelection: (outputId: string, item: IVinesExecutionResultItem) => void;
  setOutputSelections: (items: { outputId: string; item: IVinesExecutionResultItem }[]) => void;
  clearSelection: () => void;
}

const createOutputSelectionStore = () =>
  create<IOutputSelectionStore>()((set) => ({
    isSelectionMode: false,
    selectedOutputs: new Set<string>(),
    selectedOutputItems: [],
    setSelectionMode: (mode) =>
      set((state) => ({
        isSelectionMode: mode,
        ...(mode ? {} : { selectedOutputs: new Set(), selectedOutputItems: [] }),
      })),
    toggleOutputSelection: (outputId, item) =>
      set((state) => {
        const newSelectedOutputs = new Set(state.selectedOutputs);
        const newSelectedOutputItems = [...state.selectedOutputItems];

        if (newSelectedOutputs.has(outputId)) {
          newSelectedOutputs.delete(outputId);
          const index = newSelectedOutputItems.findIndex((i) => i.instanceId === outputId);
          if (index !== -1) {
            newSelectedOutputItems.splice(index, 1);
          }
        } else {
          newSelectedOutputs.add(outputId);
          newSelectedOutputItems.push(item);
        }

        return {
          selectedOutputs: newSelectedOutputs,
          selectedOutputItems: newSelectedOutputItems,
        };
      }),
    setOutputSelections: (items) =>
      set((state) => {
        const newSelectedOutputs = new Set(state.selectedOutputs);
        const newSelectedOutputItems = [...state.selectedOutputItems];

        items.forEach(({ outputId, item }) => {
          newSelectedOutputs.add(outputId);
          newSelectedOutputItems.push(item);
        });

        return {
          selectedOutputs: newSelectedOutputs,
          selectedOutputItems: newSelectedOutputItems,
        };
      }),
    clearSelection: () =>
      set({
        selectedOutputs: new Set(),
        selectedOutputItems: [],
      }),
  }));

const { Provider: OutputSelectionStoreProvider, useStore: useOutputSelectionStore } =
  createContext<StoreApi<IOutputSelectionStore>>();

export { createOutputSelectionStore, OutputSelectionStoreProvider, useOutputSelectionStore };
