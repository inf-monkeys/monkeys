import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface IWorkbenchFormInputsCacheStore {
  data: Record<string, any>;
  setKeyVal: (key: string, val: any) => void;
}
export const useWorkbenchFormInputsCacheStore = create<IWorkbenchFormInputsCacheStore>()(
  persist(
    (set) => ({
      data: {},
      setKeyVal: (key, val) => set((store) => ({ data: { ...store.data, [key]: val } })),
    }),
    {
      name: 'form_input_cache',
    },
  ),
);
export const useWorkbenchCacheVal = (key: string) => useWorkbenchFormInputsCacheStore((store) => store.data[key]);
export const useSetWorkbenchCacheVal = () => useWorkbenchFormInputsCacheStore((store) => store.setKeyVal);
