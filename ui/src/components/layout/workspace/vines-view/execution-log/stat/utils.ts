export const getDayBegin = (rawDate: Date | number | string) => {
  const date = new Date(rawDate);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const getDayEnd = (rawDate: Date | number | string) => {
  const date = new Date(rawDate);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const getRelativeDate = (rawDate: Date | number | string, offset: number) => {
  const date = new Date(rawDate);
  date.setDate(date.getDate() + offset);
  return date;
};
