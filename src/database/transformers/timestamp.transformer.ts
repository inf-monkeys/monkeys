import { ValueTransformer } from 'typeorm';

export const TimestampTransformer: ValueTransformer = {
  to(value: Date | number | string): Date | null {
    const date = toValidDate(value);
    if (!date) {
      console.warn('[TimestampTransformer.to] Invalid input:', value);
      return null;
    }
    return date;
  },

  from(value: Date | number | string): Date | null {
    const date = toValidDate(value);
    if (!date) {
      console.warn('[TimestampTransformer.from] Invalid DB timestamp:', value);
      return null;
    }
    return date;
  },
};

function toValidDate(val: any): Date | null {
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}
