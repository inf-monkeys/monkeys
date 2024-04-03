export const enumToList = (enumItem: any) => {
  return Object.keys(enumItem).map((key) => enumItem[key]);
};

export const generateDbId = () => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const randomness = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  const counter = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');

  return timestamp + randomness + counter;
};
