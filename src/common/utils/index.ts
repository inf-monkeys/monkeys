import crypto from 'crypto';

export const enumToList = (enumItem: any) => {
  return Object.keys(enumItem).map((key) => enumItem[key]);
};

export const generateDbId = (m = Math, d = Date, h = 16, s = (s) => m.floor(s).toString(h)) => s(d.now() / 1000) + ' '.repeat(h).replace(/./g, () => s(m.random() * h));

export const isValidObjectId = (id: string) => {
  // ObjectId 是一个 24 字符的十六进制字符串
  return /^[a-fA-F0-9]{24}$/.test(id);
};

export function isValidNamespace(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}

export function isValidToolName(str: string) {
  return /^(?!.*__.*$)[a-zA-Z0-9_]*$/.test(str);
}

export function isValidUrl(url: string) {
  const urlPattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i',
  ); // fragment locator
  return !!urlPattern.test(url);
}

export function getHostFromUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.host;
}

export function replacerNoEscape(key: string, value: any) {
  if (typeof value === 'string') {
    return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  return value;
}

export function generatePassword(length: number = 16) {
  // 定义密码字符集
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';

  // 创建随机字节数组
  const randomBytes = crypto.randomBytes(length);

  // 转换随机字节为字符
  let password = '';
  for (let i = 0; i < randomBytes.length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}
