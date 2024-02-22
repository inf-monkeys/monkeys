import { ImmerStateCreator } from '@/store/typings.ts';

export enum EDarkModeTrigger {
  Auto = 'auto',
  Manual = 'manual',
}

const toggleDarkMode = (dark: boolean) => document.documentElement.classList[dark ? 'add' : 'remove']('dark');

export interface DarkModeSlice {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  toggleDarkMode: (darkMode: boolean) => void;
  darkModeTrigger: EDarkModeTrigger;
  setDarkModeTrigger: (colorSchemeTrigger: EDarkModeTrigger) => void;
}

export const createDarkModeSlice: ImmerStateCreator<DarkModeSlice> = (set, get) => ({
  darkMode: false,
  setDarkMode: (darkMode) => {
    toggleDarkMode(darkMode);
    set({ darkMode });
  },
  toggleDarkMode: (darkMode) => {
    const { darkModeTrigger } = get();
    if (darkModeTrigger === EDarkModeTrigger.Auto) {
      toggleDarkMode(darkMode);
      return set({ darkMode });
    }
  },
  darkModeTrigger: EDarkModeTrigger.Auto,
  setDarkModeTrigger: (colorSchemeTrigger) =>
    set(() => {
      if (colorSchemeTrigger === EDarkModeTrigger.Auto) {
        const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        toggleDarkMode(darkMode);
        return { darkModeTrigger: colorSchemeTrigger, darkMode };
      }
      return { darkModeTrigger: colorSchemeTrigger };
    }),
});
