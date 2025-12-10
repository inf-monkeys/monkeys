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

  // 如果传入了自定义宽高，则遵循传入参数进行缩放/裁剪
  const hasCustomSize = Boolean(options.width || options.height);
  const transformer = hasCustomSize
    ? sharp(inputBuffer).resize({
        width: options.width,
        height: options.height,
        fit: (options.fit ?? 'cover') as keyof sharp.FitEnum,
        position: 'attention',
        withoutEnlargement: true,
      } as sharp.ResizeOptions)
    : (() => {
        // 未指定尺寸时，按最长边 200 生成等比缩略图
        return sharp(inputBuffer).resize({
          width: 200,
          height: 200,
          fit: 'inside',
          withoutEnlargement: true,
        } as sharp.ResizeOptions);
      })();

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
