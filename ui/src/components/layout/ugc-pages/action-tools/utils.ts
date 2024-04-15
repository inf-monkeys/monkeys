import { BlockPricing } from '@/apis/tools/typings.ts';

export const pricingText = (pricing: BlockPricing) => {
  if (pricing.mode === 'free') {
    return '免费';
  } else if (pricing.mode === 'per-execute') {
    return `每次运行收费 ${pricing.unitPriceAmount / 100} 元`;
  } else if (pricing.mode === 'per-1k-token') {
    return `每 1K Token 收费 ${pricing.unitPriceAmount / 100}`;
  } else if (pricing.mode === 'per-1min') {
    return `每 1 分钟收费 ${pricing.unitPriceAmount / 100}`;
  } else if (pricing.mode === 'per-1mb-file') {
    return `每 1 MB 文件收费 ${pricing.unitPriceAmount / 100}`;
  } else {
    return '未知';
  }
};
