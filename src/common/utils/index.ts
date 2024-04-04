export const enumToList = (enumItem: any) => {
  return Object.keys(enumItem).map((key) => enumItem[key]);
};

export const generateDbId = (m = Math, d = Date, h = 16, s = (s) => m.floor(s).toString(h)) => s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));

export function isValidNamespace(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}

export function isValidToolName(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}
