import { create } from 'zustand';

import { IVinesExecutionResultItem } from '@/utils/execution';

export type ImagesResult = IVinesExecutionResultItem & {
  render: {
    type: 'image';
  };
};

interface IExecutionImageResultStore {
  position: number;
  images: ImagesResult[];
  setPosition: (newPosition: number) => void;
  setImages: (images: ImagesResult[]) => void;
  clearImages: () => void;
  nextImage: () => void;
  prevImage: () => void;
}

export const useExecutionImageResultStore = create<IExecutionImageResultStore>()((set) => ({
  position: 0,
  images: [],
  setPosition: (newPosition) => {
    set({
      position: newPosition,
    });
  },
  clearImages: () =>
    set({
      images: [],
    }),
  setImages: (images) =>
    set({
      images,
    }),
  nextImage: () =>
    set((state) => {
      const length = state.images.length;
      if (state.position < length - 1) {
        return {
          position: state.position + 1,
        };
      } else {
        return state;
      }
    }),
  prevImage: () => {
    set((state) => {
      if (state.position > 0) {
        return {
          position: state.position - 1,
        };
      } else {
        return state;
      }
    });
  },
}));
export const useHasNextImage = () =>
  useExecutionImageResultStore((store) => store.images?.length && store.position < store.images.length - 1);
export const useHasPrevImage = () =>
  useExecutionImageResultStore((store) => store.images?.length && store.position > 0);
