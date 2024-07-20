/**
 * 将值限制在 0 和最大值之间
 * @param value - 要限制的值
 * @param max - 最大值, 默认为 100
 * @returns 限制后的值
 */
export const clampPercentage = (value: number, max: number = 100) => {
  return Math.min(Math.max(value, 0), max);
};
