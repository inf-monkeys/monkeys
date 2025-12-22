export const downloadFile = (file: File | Blob, filename?: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = filename || (file instanceof File ? file.name : 'download');
  link.click();
  URL.revokeObjectURL(url);
};

export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    // 先尝试不使用 crossOrigin（适用于相同域或不需要 CORS 的图片）
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      // 如果失败，尝试使用 crossOrigin
      const img2 = new Image();
      img2.crossOrigin = 'anonymous';
      img2.onload = () => {
        resolve({ width: img2.naturalWidth, height: img2.naturalHeight });
      };
      img2.onerror = reject;
      img2.src = url;
    };
    img.src = url;
  });
};

export const getThumbUrl = (url: string, enableSystemImageThumbnail: boolean = false) => {
  if (enableSystemImageThumbnail) {
    const systemPrefixAPIPath = '/api/medias/s3/thumbnail';
    const systemPrefixAPIUrl = new URL(systemPrefixAPIPath, window.location.origin);
    systemPrefixAPIUrl.searchParams.set('url', url);
    return systemPrefixAPIUrl.toString();
  } else {
    const urlPath = url.split('/');
    const urlPathLength = urlPath.length;
    return urlPath.map((it, i) => (i === urlPathLength - 2 ? `${it}_thumb` : it)).join('/');
  }
};

// 常见的宽高比预设
export const COMMON_ASPECT_RATIOS = [
  { ratio: 1, label: '1:1' }, // 正方形
  { ratio: 4 / 3, label: '4:3' }, // 标准
  { ratio: 3 / 4, label: '3:4' }, // 竖版标准
  { ratio: 16 / 9, label: '16:9' }, // 宽屏
  { ratio: 9 / 16, label: '9:16' }, // 竖版宽屏
  { ratio: 21 / 9, label: '21:9' }, // 超宽屏
  { ratio: 9 / 21, label: '9:21' }, // 竖版超宽屏
  { ratio: 2 / 3, label: '2:3' }, // 经典照片
  { ratio: 3 / 2, label: '3:2' }, // 经典照片横版
  { ratio: 5 / 4, label: '5:4' },
  { ratio: 4 / 5, label: '4:5' },
];

/**
 * 计算两个数的最大公约数
 */
const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

/**
 * 简化宽高比为最简分数形式
 */
export const simplifyAspectRatio = (width: number, height: number): string => {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

/**
 * 根据图片尺寸计算最接近的预设宽高比
 * @param width 图片宽度
 * @param height 图片高度
 * @param tolerance 容差范围（0-1），默认0.1表示10%的误差容忍
 * @returns 最接近的宽高比字符串（如 "16:9"）
 */
export const calculateAspectRatio = (width: number, height: number, tolerance: number = 0.1): string => {
  const actualRatio = width / height;

  // 查找最接近的预设宽高比
  let closestMatch = COMMON_ASPECT_RATIOS[0];
  let minDifference = Math.abs(actualRatio - closestMatch.ratio);

  for (const preset of COMMON_ASPECT_RATIOS) {
    const difference = Math.abs(actualRatio - preset.ratio);
    if (difference < minDifference) {
      minDifference = difference;
      closestMatch = preset;
    }
  }

  const relativeDifference = minDifference / actualRatio;

  // 第一次尝试：10% 容差
  if (relativeDifference <= 0.1) {
    return closestMatch.label;
  }

  // 第二次尝试：20% 容差
  if (relativeDifference <= 0.2) {
    return closestMatch.label;
  }

  // 如果都不匹配，默认返回 1:1
  return '1:1';
};

/**
 * 从图片URL检测尺寸并计算宽高比
 * @param imageUrl 图片URL
 * @param tolerance 容差范围
 * @returns 宽高比字符串
 */
export const detectAspectRatioFromUrl = async (imageUrl: string, tolerance?: number): Promise<string> => {
  try {
    const { width, height } = await getImageSize(imageUrl);
    return calculateAspectRatio(width, height, tolerance);
  } catch (error) {
    console.error('Failed to detect aspect ratio:', error);
    throw error;
  }
};
