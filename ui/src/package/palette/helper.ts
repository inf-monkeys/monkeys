import chroma from 'chroma-js';

const MAX_VALUE = 500;
const delta = { xs: 0.01, sm: 0.02, md: 0.03, lg: 0.08, xl: 0.14 };

const normalizeHue = (input: number, range: number): number => ((input % range) + range) % range;

export const markDarkColor = (color: string) => {
  const hsv = chroma(color).hsv();
  return chroma(hsv[0], hsv[1] * 0.92, Math.min(hsv[2] + 0.01, 1), 'hsv').hex();
};

// 计算 hsv 颜色的 h 值
export const calculateHue = (color: number[], end: number, defaultValue?: number): number => {
  defaultValue === void 0 && (defaultValue = MAX_VALUE);

  const interval = end - defaultValue;

  let offset: number;
  if (end <= defaultValue) {
    if (color[0] > 80 && color[0] < 260) {
      offset = interval * delta.xs;
    } else {
      offset = -interval * delta.sm;
    }
  } else if (color[0] > 20 && color[0] < 48) {
    offset = -interval * delta.md;
  } else if (color[0] >= 48 && color[0] < 260) {
    offset = interval * delta.xs;
  } else {
    offset = -interval * delta.sm;
  }

  return normalizeHue(color[0] + offset, 360);
};

// 计算颜色的饱和度
export const calculateSaturation = (hsv: number[], range: number, max?: number): number => {
  max === void 0 && (max = MAX_VALUE);

  // 计算区间大小
  const interval = (range - max) / 100;

  let offset = 0;
  if (range < max) {
    offset = (interval * hsv[1]) / 5;
    if (range < 100) {
      offset -= delta.sm;
    }
  } else if (range > max) {
    if (hsv[0] < 30 || hsv[0] > 200) {
      offset = interval * delta.md;
    } else {
      offset = interval * delta.xs;
    }
    if (hsv[1] === 0) {
      offset = 0;
    }
  }

  const newSaturation = hsv[1] + offset;
  return newSaturation > 1 ? 1 : newSaturation < 0 ? 0 : newSaturation;
};

// 计算颜色的亮度
export const calculateLightness = (hsv: number[], range: number, max?: number): number => {
  max === void 0 && (max = MAX_VALUE);

  // 计算区间大小
  const interval = (range - max) / 100;

  let offset = 0;

  if (range < max) {
    if (hsv[1] < 0.1) {
      offset = ((interval * (1 - hsv[2])) / 5) * 1.06;
    } else {
      offset = (interval * (1 - hsv[2])) / 5;
    }
  } else if (range > max) {
    if ((hsv[0] < 30 || hsv[0] > 200) && hsv[0] > 0) {
      offset = interval * delta.lg;
      if (hsv[2] > 0.8) {
        offset = interval * delta.xl;
      }
    } else {
      offset = (interval * hsv[2]) / 6;
    }
  }

  const newLightness = hsv[2] - offset;
  return newLightness > 1 ? 1 : newLightness < 0 ? 0 : newLightness;
};
