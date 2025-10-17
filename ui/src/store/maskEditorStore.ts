import { create } from 'zustand';

interface MaskEditorState {
  isEditorOpen: boolean;
  setEditorOpen: (open: boolean) => void;
}

export const useMaskEditorStore = create<MaskEditorState>((set) => ({
  isEditorOpen: false,
  setEditorOpen: (open: boolean) => set({ isEditorOpen: open }),
}));
