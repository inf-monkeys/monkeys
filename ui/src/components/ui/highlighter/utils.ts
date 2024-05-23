export const isSingleLine = (str: string): boolean => {
  const matches = str.match(/\n/g);
  const lines = matches ? matches.length : 1;
  return lines <= 1 && str.length <= 32;
};
