import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface IWorkbenchFormInputsCacheStore {
  data: Record<string, any>;
  setKeyVal: (key: string, val: any) => void;
  reset: (key: string) => void;
}
export const useWorkbenchFormInputsCacheStore = create<IWorkbenchFormInputsCacheStore>()(
  persist(
    (set) => ({
      data: {},
      setKeyVal: (key, val) => set((store) => ({ data: { ...store.data, [key]: val } })),
      reset: (key) => set((store) => ({ data: { ...store.data, [key]: {} } })),
    }),
    {
      name: 'form_input_cache',
    },
  ),
);
export const useWorkbenchCacheVal = (key: string) => useWorkbenchFormInputsCacheStore((store) => store.data[key]);
export const useSetWorkbenchCacheVal = () => useWorkbenchFormInputsCacheStore((store) => store.setKeyVal);
export const useResetWorkbenchCacheVal = () => useWorkbenchFormInputsCacheStore((store) => store.reset);

export const clearWorkbenchFormInputsCache = () => {
  const persistApi = (
    useWorkbenchFormInputsCacheStore as typeof useWorkbenchFormInputsCacheStore & {
      persist?: {
        clearStorage: () => Promise<void> | void;
        rehydrate?: () => Promise<void>;
      };
    }
  ).persist;

  try {
    persistApi?.clearStorage?.();
  } catch (error) {
    console.error('Failed to clear persisted workflow form storage:', error);
  } finally {
    useWorkbenchFormInputsCacheStore.setState({ data: {} });
    void persistApi?.rehydrate?.();
  }
};
