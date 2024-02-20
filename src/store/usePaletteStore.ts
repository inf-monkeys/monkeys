import { isEmpty, isObject, pick, set as _set } from 'lodash';
import { create, StateCreator, StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { Mode, Palette, SwatchValue } from '@/package/palette/typings.ts';
import { createSwatches, DEFAULT_PALETTE_CONFIG, setTailwindTheme } from '@/package/palette/usePalette.ts';

const autoTogglePalette =
  <T>(config: StateCreator<T>) =>
  (set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], api: StoreApi<T>) =>
    config(
      (args: T) => {
        const palette = pick(get(), [
          'value',
          'valueStop',
          'useLightness',
          'h',
          's',
          'lMin',
          'lMax',
          'mode',
        ]) as Partial<Palette>;

        if (isObject(args)) {
          if ('value' in args && !isEmpty(args.value)) {
            _set(palette, 'value', args.value);
            const swatches = createSwatches(palette as Partial<Palette> & { value: string });
            _set(args, 'swatches', swatches);
            setTailwindTheme({ swatches });
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
  valueStop: number;
  setValueStop: (valueStop: number) => void;
  swatches: SwatchValue[];
  setSwatches: (swatches: SwatchValue[]) => void;
  useLightness: boolean;
  setUseLightness: (useLightness: boolean) => void;
  h: number;
  setH: (h: number) => void;
  s: number;
  setS: (s: number) => void;
  lMin: number;
  setLMin: (lMin: number) => void;
  lMax: number;
  setLMax: (lMax: number) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
}

const usePaletteStore = create<PaletteStore>()(
  immer(
    autoTogglePalette((set) => ({
      value: DEFAULT_PALETTE_CONFIG.value,
      setValue: (value: string) => set({ value }),
      valueStop: DEFAULT_PALETTE_CONFIG.valueStop,
      setValueStop: (valueStop: number) => set({ valueStop }),
      swatches: DEFAULT_PALETTE_CONFIG.swatches,
      setSwatches: (swatches: SwatchValue[]) => set({ swatches }),
      useLightness: DEFAULT_PALETTE_CONFIG.useLightness,
      setUseLightness: (useLightness: boolean) => set({ useLightness }),
      h: DEFAULT_PALETTE_CONFIG.h,
      setH: (h: number) => set({ h }),
      s: DEFAULT_PALETTE_CONFIG.s,
      setS: (s: number) => set({ s }),
      lMin: DEFAULT_PALETTE_CONFIG.lMin,
      setLMin: (lMin: number) => set({ lMin }),
      lMax: DEFAULT_PALETTE_CONFIG.lMax,
      setLMax: (lMax: number) => set({ lMax }),
      mode: DEFAULT_PALETTE_CONFIG.mode,
      setMode: (mode: Mode) => set({ mode }),
    })),
  ),
);

export default usePaletteStore;
