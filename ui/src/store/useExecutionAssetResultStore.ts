import { create } from 'zustand';

import { IVinesExecutionResultItem } from '@/utils/execution';

export type AssetResult = IVinesExecutionResultItem;

interface IExecutionAssetResultStore {
  position: number;
  assets: AssetResult[];
  setPosition: (newPosition: number) => void;
  setAssets: (assets: AssetResult[]) => void;
  clearAssets: () => void;
  nextAsset: () => void;
  prevAsset: () => void;
}

export const useExecutionAssetResultStore = create<IExecutionAssetResultStore>()((set) => ({
  position: 0,
  assets: [],
  setPosition: (newPosition) => set({ position: newPosition }),
  setAssets: (assets) => set({ assets }),
  clearAssets: () => set({ assets: [] }),
  nextAsset: () =>
    set((state) => {
      const length = state.assets.length;
      if (state.position < length - 1) return { position: state.position + 1 };
      return state;
    }),
  prevAsset: () =>
    set((state) => {
      if (state.position > 0) return { position: state.position - 1 };
      return state;
    }),
}));

export const useHasNextAsset = () =>
  useExecutionAssetResultStore((store) => store.assets?.length && store.position < store.assets.length - 1);
export const useHasPrevAsset = () => useExecutionAssetResultStore((store) => store.assets?.length && store.position > 0);
export const useExecutionAssets = () => useExecutionAssetResultStore((store) => store.assets);
export const useExecutionAssetPosition = () => useExecutionAssetResultStore((store) => store.position);
export const useSetExecutionAssetPosition = () => useExecutionAssetResultStore((store) => store.setPosition);
export const useSetExecutionAssets = () => useExecutionAssetResultStore((store) => store.setAssets);


