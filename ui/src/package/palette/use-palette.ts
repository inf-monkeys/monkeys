import chroma from 'chroma-js';
import { debounce } from 'lodash';

import { calculateHue, calculateLightness, calculateSaturation, markDarkColor } from '@/package/palette/helper.ts';

const COLOR_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// 纯色色阶推导
export const createSolidColorScale = (color: string, mode = 'light') => {
  const isDark = mode === 'dark';
  let baseColor = isDark ? markDarkColor(color) : color;

  // 检查颜色是否过暗
  const luminance = chroma(baseColor).luminance();
  if (isDark && luminance < 0.1) {
    // 如果颜色过暗，将其反转为亮色
    baseColor = chroma(baseColor).set('hsl.l', 0.4).hex();
  }

  const hsv = chroma(baseColor).hsv();

  const colors = COLOR_STOPS.map((stop) => {
    const h = calculateHue(hsv, stop, 500);
    const s = calculateSaturation(hsv, stop, 500);
    const v = calculateLightness(hsv, stop, 500);
    return chroma(h, s, v, 'hsv');
  });

  return isDark ? colors.reverse() : colors;
};

export const genTailwindTheme = (color: string) => {
  const lightColors = createSolidColorScale(color, 'light');
  const darkColors = createSolidColorScale(color, 'dark');

  const twColors: Record<string, string[]> = {};
  ['vines', 'vines-dark'].forEach((name, i) => {
    const colors = {};
    if (!i) {
      lightColors.map((it, stopIndex) =>
        Object.assign(colors, {
          [COLOR_STOPS[stopIndex]]: it.rgb().join(' '),
        }),
      );
    } else {
      darkColors.map((it, stopIndex) =>
        Object.assign(colors, {
          [COLOR_STOPS[stopIndex]]: it.rgb().join(' '),
        }),
      );
    }
    Object.assign(twColors, { [name]: colors });
  });

  return twColors;
};

export const setTailwindTheme = debounce((color: string) => {
  const twColors = genTailwindTheme(color);

  let styles = '';
  Object.entries(twColors).forEach(([colorName, colorValues]) => {
    styles += (colorName === 'vines-dark' ? '.dark' : ':root,::selection') + '{';
    Object.entries(colorValues).forEach(([stop, color]) => {
      styles += `--vines-${stop}:${color};`;
    });
    styles += '}';
  });

  const themeDOM = document.getElementById('vines-theme');
  void (themeDOM && (themeDOM.innerHTML = styles));
}, 64);
