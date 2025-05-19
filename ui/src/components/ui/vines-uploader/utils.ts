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
  if (!url || typeof url !== 'string') return false;

  // 检查是否为有效的URL字符串
  if (!url.startsWith && !url.endsWith) {
    return false;
  }

  // 检查是否为HTTP/HTTPS URL
  const isHttpUrl = url.startsWith('http://') || url.startsWith('https://');

  // 检查是否为相对路径URL
  const isRelativeUrl = url.startsWith('/') && !url.startsWith('//');

  // 检查是否包含常见图片扩展名
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp)($|\?)/i.test(url);

  // 检查是否包含特定的路径模式（如workflow路径）
  const hasWorkflowPath =
    url.includes('/monkeys/workflow/') ||
    url.includes('/user-files/workflow-input/') ||
    url.includes('/monkeyminio01.daocloud.cn/');

  // 对于HTTP URL，我们认为它是有效的，如果它包含图片扩展名或特定路径
  const isValidHttpUrl = isHttpUrl && (hasImageExtension || hasWorkflowPath || url.includes('/monkeys/'));

  // 对于相对URL，我们需要它包含图片扩展名或特定路径
  const isValidRelativeUrl = isRelativeUrl && (hasImageExtension || hasWorkflowPath);

  const result = isValidHttpUrl || isValidRelativeUrl;

  return result;
};

export const getFileNameByOssUrl = (url?: string, DEFAULT_NAME = 'unknown.jpg') => {
  if (!url) return DEFAULT_NAME;

  try {
    const decodedUrl = decodeURIComponent(url);

    const regexPatterns = {
      ossWithPrefix: /^https?:\/\/\S+\/(?:\S+\/)*(R[^_]+)_(.+)$/,
      general: /^https?:\/\/\S+\/(?:\S+\/)*(\S+\.\S+)$/,
      workflowPath: /\/monkeys\/workflow\/[^/]+\/([^/?]+)$/,
      relativePath: /\/([^/]+\.(jpg|jpeg|png|gif|webp|bmp))($|\?)/i,
    };

    // 尝试各种模式匹配
    let match: string | null = null;

    // 尝试ossWithPrefix模式
    const ossMatch = regexPatterns.ossWithPrefix.exec(decodedUrl);
    if (ossMatch && ossMatch[2]) {
      match = ossMatch[2];
    }

    // 尝试general模式
    if (!match) {
      const generalMatch = regexPatterns.general.exec(decodedUrl);
      if (generalMatch && generalMatch[1]) {
        match = generalMatch[1];
      }
    }

    // 尝试workflowPath模式
    if (!match) {
      const workflowMatch = regexPatterns.workflowPath.exec(decodedUrl);
      if (workflowMatch && workflowMatch[1]) {
        match = workflowMatch[1];
      }
    }

    // 尝试relativePath模式
    if (!match) {
      const relativeMatch = regexPatterns.relativePath.exec(decodedUrl);
      if (relativeMatch && relativeMatch[1]) {
        match = relativeMatch[1];
      }
    }

    // 如果所有模式都不匹配，使用URL的最后一部分
    if (!match && decodedUrl.includes('/')) {
      const parts = decodedUrl.split('/');
      const lastPart = parts[parts.length - 1].split('?')[0];
      if (lastPart) {
        match = lastPart;
      }
    }

    if (!match) {
      return DEFAULT_NAME;
    }

    return match;
  } catch (error) {
    return DEFAULT_NAME;
  }
};

export const generateSSOFilePrefixId = (length = 6) =>
  'R' + customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', length - 1)();
