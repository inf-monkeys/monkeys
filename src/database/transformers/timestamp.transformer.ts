export const TimestampTransformer = {
  // 从数据库读取时，将 timestamp 转换为 number
  from: (value: Date | null): number | null => {
    return value ? value.getTime() : null;
  },
  // 写入数据库时，将 number 转换为 Date
  to: (value: number | null): Date | null => {
    return value ? new Date(value) : null;
  },
};
