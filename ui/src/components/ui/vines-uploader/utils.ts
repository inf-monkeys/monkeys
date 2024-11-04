import { customAlphabet } from 'nanoid';

export const addProtocolToURL = (url: string) => {
  const protocolRegex = /^[a-z0-9]+:\/\//;
  const defaultProtocol = 'http://';
  if (protocolRegex.test(url)) {
    return url;
  }

  return defaultProtocol + url;
};

export const checkIfCorrectURL = (url?: string) => {
  return url?.startsWith('http://') || url?.startsWith('https://');
};

export const getFileNameByOssUrl = (url?: string, DEFAULT_NAME = 'unknown.jpg') => {
  if (!url) return DEFAULT_NAME;

  const decodedUrl = decodeURIComponent(url);

  const regexPatterns = {
    ossWithPrefix: /^https?:\/\/\S+\/(?:\S+\/)*(R[^_]+)_(.+)$/,
    general: /^https?:\/\/\S+\/(?:\S+\/)*(\S+\.\S+)$/,
  };

  const match =
    (regexPatterns.ossWithPrefix.exec(decodedUrl) && regexPatterns.ossWithPrefix.exec(decodedUrl)![2]) ||
    (regexPatterns.general.exec(decodedUrl) && regexPatterns.general.exec(decodedUrl)![1]);

  return match || DEFAULT_NAME;
};

export const generateSSOFilePrefixId = (length = 6) =>
  'R' + customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', length - 1)();
