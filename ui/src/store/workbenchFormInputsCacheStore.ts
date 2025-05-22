import { create } from 'zustand';
interface IWorkbenchFormInputsCacheStore {
  data: Record<string, any>;
  setKeyVal: (key: string, val: any) => void;
}
export const useWorkbenchFormInputsCacheStore = create<IWorkbenchFormInputsCacheStore>()((set) => ({
  data: {},
  setKeyVal: (key, val) => set((store) => ({ data: { ...store.data, [key]: val } })),
}));
export const useWorkbenchCacheVal = (key: string) => useWorkbenchFormInputsCacheStore((store) => store.data[key]);
export const useSetWorkbenchCacheVal = () => useWorkbenchFormInputsCacheStore((store) => store.setKeyVal);
