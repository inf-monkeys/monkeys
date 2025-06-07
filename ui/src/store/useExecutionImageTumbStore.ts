import { create } from 'zustand';
interface IThumbImagesStore {
  thumbs: string[];
  setThumbs: (thumbs: string[]) => void;
}
export const useThumbImagesStore = create<IThumbImagesStore>()((set) => ({
  thumbs: [],
  setThumbs: (thumbs) => set({ thumbs }),
}));

export const useSetThumbImages = () => useThumbImagesStore((state) => state.setThumbs);

export const useThumbImages = () => useThumbImagesStore((state) => state.thumbs);
