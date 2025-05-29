import { create } from 'zustand';

interface IBoardCanvasSizeStore {
  width: number;
  height: number;
  setBoardCanvasSize: (width: number, height: number) => void;
}

export const useBoardCanvasSizeStore = create<IBoardCanvasSizeStore>()((set) => ({
  width: 1280,
  height: 720,
  setBoardCanvasSize: (width: number, height: number) => set({ width, height }),
}));

export const useSetBoardCanvasSize = () => {
  return useBoardCanvasSizeStore((state) => state.setBoardCanvasSize);
};

export const useBoardCanvasSize = () => {
  return useBoardCanvasSizeStore((store) => ({
    width: store.width,
    height: store.height,
  }));
};
