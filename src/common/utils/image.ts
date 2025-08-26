import axios from 'axios';
import sharp from 'sharp';
import { logger } from '../logger';
export async function downloadFileAsArrayBuffer(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return response.data.buffer;
  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}

export async function downloadFileAsBuffer(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}

export type SupportedFormat = keyof sharp.FormatEnum;

export interface ThumbnailResult {
  buffer: Buffer; // 缩略图 Buffer
  format: SupportedFormat; // 输出格式
  info: sharp.OutputInfo; // sharp 的元信息
}

export async function generateThumbnail(
  inputBuffer: Buffer,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    format?: SupportedFormat;
    quality?: number;
  } = {},
): Promise<ThumbnailResult> {
  const { format = 'jpeg', quality = 80 } = options;

  // 获取原图尺寸
  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;

  // 计算缩放比例,保持原比例,最长边200
  const maxSize = 200;
  let resizeWidth = 200;
  let resizeHeight = 200;

  if (originalWidth > originalHeight) {
    resizeWidth = maxSize;
    resizeHeight = Math.round((maxSize * originalHeight) / originalWidth);
  } else {
    resizeHeight = maxSize;
    resizeWidth = Math.round((maxSize * originalWidth) / originalHeight);
  }

  const transformer = sharp(inputBuffer).resize(resizeWidth, resizeHeight);

  // 根据格式选择输出
  switch (format) {
    case 'jpeg':
      transformer.jpeg({ quality });
      break;
    case 'png':
      transformer.png();
      break;
    case 'webp':
      transformer.webp({ quality });
      break;
    case 'avif':
      transformer.avif({ quality });
      break;
    case 'gif':
      transformer.gif();
      break;
    case 'heif':
      transformer.heif({ quality });
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  const { data, info } = await transformer.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    format: format as SupportedFormat,
    info,
  };
}
