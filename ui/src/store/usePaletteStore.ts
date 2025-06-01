import { isEmpty, isObject } from 'lodash';
import { create, StateCreator, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { setTailwindTheme } from '@/package/palette/use-palette.ts';

const autoTogglePalette =
  <T>(config: StateCreator<T>) =>
  (set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], api: StoreApi<T>) =>
    config(
      (args: T) => {
        if (isObject(args)) {
          if ('value' in args && !isEmpty(args.value)) {
            setTailwindTheme(args.value as string);
          }
        }

        set(args);
      },
      get,
      api,
    );

export interface PaletteStore {
  value: string;
  setValue: (value: string) => void;
}

const usePaletteStore = create<PaletteStore>()(
  immer(
    autoTogglePalette((set) => ({
      value: '',
      setValue: (value: string) => set({ value }),
    })),
  ),
);
const useNeocardPaletteStore = create<PaletteStore>()(
  immer(
    autoTogglePalette((set) => ({
      value: '',
      setValue: (value: string) => set({ value }),
    })),
  ),
);

export default usePaletteStore;
export { useNeocardPaletteStore };
