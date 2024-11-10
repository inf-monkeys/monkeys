import { ImmerStateCreator } from '@/store/typings.ts';

export type VinesLucideIconSVG = [string, { d: string; key: string }][];
export type VinesLucideIconMetadata = {
  categories: string[];
  tags: string[];
};

export interface IconsSlice {
  iconSVG: Record<string, VinesLucideIconSVG>;
  iconMetadata: Record<string, VinesLucideIconMetadata>;

  iconNames: string[];

  iconInitialized: boolean;
  setIcons: (
    iconSVG: Record<string, VinesLucideIconSVG>,
    iconMetadata: Record<string, VinesLucideIconMetadata>,
  ) => void;
}

export const createIconsSlice: ImmerStateCreator<IconsSlice> = (set) => ({
  iconSVG: {},
  iconMetadata: {},

  iconNames: [],

  iconInitialized: false,
  setIcons: (iconSVG, iconMetadata) => {
    set((state) => {
      state.iconSVG = iconSVG;
      state.iconMetadata = iconMetadata;
      state.iconNames = Object.keys(iconSVG);
      state.iconInitialized = true;
    });
  },
});
