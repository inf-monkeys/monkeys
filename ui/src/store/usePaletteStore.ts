import { isEmpty, isObject } from 'lodash';
import { create, StateCreator, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { setNeocardTheme } from '@/package/palette/use-neocard-palette.ts';
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

const autoToggleNeocardPalette =
  <T>(config: StateCreator<T>) =>
  (set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], api: StoreApi<T>) =>
    config(
      (args: T) => {
        if (isObject(args)) {
          if ('value' in args && !isEmpty(args.value)) {
            const value = args.value;
            if (typeof value === 'string' && value) {
              setNeocardTheme(value);
            } else if (isObject(value) && ('light' in value || 'dark' in value)) {
              setNeocardTheme(value as { light: string; dark: string });
            }
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

export interface NeocardPaletteStore {
  value: { light: string; dark: string } | string;
  setValue: (value: { light: string; dark: string } | string) => void;
}

const usePaletteStore = create<PaletteStore>()(
  immer(
    autoTogglePalette((set) => ({
      value: '',
      setValue: (value: string) => set({ value }),
    })),
  ),
);

const useNeocardPaletteStore = create<NeocardPaletteStore>()(
  immer(
    autoToggleNeocardPalette((set) => ({
      value: { light: '', dark: '' },
      setValue: (value: { light: string; dark: string } | string) => set({ value }),
    })),
  ),
);

export default usePaletteStore;
export { useNeocardPaletteStore };
