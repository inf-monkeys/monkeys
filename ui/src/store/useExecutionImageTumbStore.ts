import { create } from 'zustand';

import { ImagesResult } from './useExecutionImageResultStore';
interface IThumbImagesStore {
  thumbs: ImagesResult[];
  setThumbs: (thumbs: ImagesResult[]) => void;
}
export const useThumbImagesStore = create<IThumbImagesStore>()((set) => ({
  thumbs: [],
  setThumbs: (thumbs) => set({ thumbs }),
}));

export const useSetThumbImages = () => useThumbImagesStore((state) => state.setThumbs);

export const useThumbImages = () => useThumbImagesStore((state) => state.thumbs);
