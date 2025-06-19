import { create } from 'zustand';

interface IGlobalTempStore {
  tempMap: Map<string, any>;
  setTemp: (key: string, value: any) => void;
  getTemp: (key: string) => any;
  clearTemp: () => void;
}

export const useGlobalTempStore = create<IGlobalTempStore>()((set, get) => ({
  tempMap: new Map(),
  setTemp: (key, value) =>
    set((state) => {
      const newMap = new Map(state.tempMap);
      newMap.set(key, value);
      return { tempMap: newMap };
    }),
  getTemp: (key) => get().tempMap.get(key),
  clearTemp: () => set({ tempMap: new Map() }),
}));

export const useSetTemp = () => useGlobalTempStore((state) => state.setTemp);
export const useGetTemp = () => useGlobalTempStore((state) => state.getTemp);
export const useClearTemp = () => useGlobalTempStore((state) => state.clearTemp);
