import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormVisibilityState {
  isFormVisible: boolean;
  toggleFormVisibility: () => void;
}

export const useFormVisibilityStore = create<FormVisibilityState>()(
  persist(
    (set) => ({
      isFormVisible: true,
      toggleFormVisibility: () => set((state) => ({ isFormVisible: !state.isFormVisible })),
    }),
    {
      name: 'form-visibility', // localStorage key
    }
  )
); 