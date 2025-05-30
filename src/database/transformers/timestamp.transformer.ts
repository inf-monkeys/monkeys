import { ValueTransformer } from 'typeorm';

export const TimestampTransformer: ValueTransformer = {
  // 从 JavaScript 值转换为数据库值
  to(value: Date | number | string): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    return value;
  },

  // 从数据库值转换为 JavaScript Date
  from(value: Date | string | number): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    return value;
  },
};
