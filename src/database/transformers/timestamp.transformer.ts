import { logger } from '@/common/logger';
import { ValueTransformer } from 'typeorm';

function toValidDate(value: any): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'number') return isNaN(value) ? null : new Date(value);
  if (typeof value === 'string') {
    // 判断是不是纯数字字符串
    if (/^\d+$/.test(value)) {
      const num = parseInt(value, 10);
      return isNaN(num) ? null : new Date(num);
    }
    // 普通时间字符串
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}


export const TimestampTransformer: ValueTransformer = {
  to(value: Date | number | string): Date | null {
    const date = toValidDate(value);
    if (!date) {
      logger.warn('[TimestampTransformer.to] Invalid input:', value);
      return null;
    }
    return date;
  },

  from(value: Date | string | number): number | null {
    const date = toValidDate(value);
    if (!date) {
      logger.warn('[TimestampTransformer.from] Invalid input from DB:', value);
      return null;
    }
    return date.getTime();
  },
};
