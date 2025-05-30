import { ValueTransformer } from 'typeorm';

export const TimestampTransformer: ValueTransformer = {
  // 从 JavaScript Date 转换为数据库值
  to(value: Date | number | string): number {
    if (value instanceof Date) {
      return value.getTime();
    }
    if (typeof value === 'string') {
      return new Date(value).getTime();
    }
    return value;
  },
  // 从数据库值转换为 JavaScript Date
  from(value: string | number): Date {
    if (typeof value === 'string') {
      return new Date(parseInt(value));
    }
    return new Date(value);
  },
};
