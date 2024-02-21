import chroma from 'chroma-js';
import { debounce } from 'lodash';

import {
  clamp,
  hexToHSL,
  HSLToHex,
  isHex,
  lightnessFromHSLum,
  luminanceFromHex,
  round,
  unsignedModulo,
} from '@/package/palette/helpers';
import { createDistributionValues, createHueScale, createSaturationScale } from '@/package/palette/helpers/scales.ts';
import { Mode, Palette, TwColors } from '@/package/palette/typings.ts';

export const DEFAULT_STOP = 500;
export const DEFAULT_STOPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];

export const MODES: Mode[] = [`hex`, `p-3`, 'oklch'];

export const DEFAULT_PALETTE_CONFIG: Palette = {
  value: '',
  valueStop: DEFAULT_STOP,
  swatches: [],
  h: 0,
  s: 5,
  lMin: 20,
  lMax: 100,
  useLightness: false,
  mode: MODES[2],
};

export const createSwatches = (palette: Partial<Palette> & Pick<Palette, 'value'>) => {
  const { value, valueStop = DEFAULT_STOP } = palette;

  const finalValue = value.replace(/^#/, '');

  // Tweaks may be passed in, otherwise use defaults
  const useLightness = palette.useLightness ?? DEFAULT_PALETTE_CONFIG.useLightness;
  const h = palette.h ?? DEFAULT_PALETTE_CONFIG.h;
  const s = palette.s ?? DEFAULT_PALETTE_CONFIG.s;
  const lMin = palette.lMin ?? DEFAULT_PALETTE_CONFIG.lMin;
  const lMax = palette.lMax ?? DEFAULT_PALETTE_CONFIG.lMax;

  // Create hue and saturation scales based on tweaks
  const hueScale = createHueScale(h, valueStop);
  const saturationScale = createSaturationScale(s, valueStop);

  // Get the base hex's H/S/L values
  const { h: valueH, s: valueS, l: valueL } = hexToHSL(finalValue);

  // Create lightness scales based on tweak + lightness/luminance of current value
  const lightnessValue = useLightness ? valueL : luminanceFromHex(finalValue);
  const distributionScale = createDistributionValues(lMin, lMax, lightnessValue, valueStop);

  return hueScale.map(({ stop }, stopIndex) => {
    const newH = unsignedModulo(valueH + hueScale[stopIndex].tweak, 360);
    const newS = clamp(valueS + saturationScale[stopIndex].tweak, 0, 100);
    const newL = useLightness
      ? distributionScale[stopIndex].tweak
      : lightnessFromHSLum(newH, newS, distributionScale[stopIndex].tweak);

    const newHex = HSLToHex(newH, newS, newL);

    return {
      stop,
      // Sometimes the initial value is changed slightly during conversion,
      // overriding that with the original value
      hex: stop === valueStop ? `#${finalValue.toUpperCase()}` : newHex.toUpperCase(),
      // Used in graphs
      h: newH,
      hScale: ((unsignedModulo(hueScale[stopIndex].tweak + 180, 360) - 180) / 180) * 50,
      s: newS,
      sScale: newS - 50,
      l: newL,
    };
  });
};

export const createDisplayColor = (color: string, mode?: Mode): string | null => {
  if (!color || !isHex(color)) {
    return null;
  }

  let display = null;

  if (!mode || mode === `hex`) {
    display = color.toUpperCase();
  } else if (mode === `p-3`) {
    const [r, g, b] = chroma(color).rgb();
    display = [round(r / 255, 3), round(g / 255, 3), round(b / 255, 3)].join(` `);
  } else if (mode === `oklch`) {
    const [l, c, h] = chroma(color).oklch();
    display = [round(l * 100, 2) + `%`, round(c, 3), round(h, 2)].join(` `);
  }

  return display;
};

const genDarkColor = (color: string) => {
  const lightv = chroma(color).hsv();
  const newDark = chroma(lightv[0], lightv[1] * 0.92, Math.min(lightv[2] + 0.01, 1), 'hsv');
  return newDark.hex();
};
export const genTailwindTheme = ({ swatches }: Partial<Palette> & Pick<Palette, 'swatches'>, mode: Mode) => {
  const twColors: TwColors = {};
  if (!swatches) {
    return twColors;
  }

  ['vines', 'vines-dark'].forEach((colorName, i) => {
    const colors = {};
    swatches
      .filter((swatch) => ![0, 1000].includes(swatch.stop))
      .forEach((swatch) =>
        Object.assign(colors, {
          [swatch.stop]: createDisplayColor(!i ? swatch.hex : genDarkColor(swatch.hex), mode),
        }),
      );

    Object.assign(twColors, { [colorName]: colors });
  });

  return twColors;
};

export const setTailwindTheme = debounce((palette: Partial<Palette> & Pick<Palette, 'swatches'>) => {
  const twColors = genTailwindTheme(palette, 'oklch');

  let styles = ':root{';
  Object.entries(twColors).forEach(([colorName, colorValues]) => {
    Object.entries(colorValues).forEach(([stop, color]) => {
      styles += `--${colorName}-${stop}:${color};`;
    });
  });
  styles += '}';

  const themeDOM = document.getElementById('vines-theme');
  void (themeDOM && (themeDOM.innerHTML = styles));
}, 64);
