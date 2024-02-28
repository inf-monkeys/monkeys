export const coverFileSize = (size: number) => {
  if (size < 1024) {
    return `${size}B`;
  }
  if (size < 1024 ** 2) {
    return `${(size / 1024).toFixed(2)}KB`;
  }
  return `${(size / 1024 ** 2).toFixed(2)}MB`;
};
