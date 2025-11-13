import sharp from 'sharp';
import { ThumbnailSize } from './thumbnail.types';

type SupportedFormat = 'jpeg' | 'jpg' | 'webp' | 'avif' | 'png';

interface TargetFormatInfo {
  format: SupportedFormat;
  extension: string;
  contentType: string;
}

interface ProcessedImageResult {
  buffer: Buffer;
  format: SupportedFormat;
  contentType: string;
}

export class ThumbnailGenerator {
  static getThumbnailPath(originalPath: string, size: ThumbnailSize, prefix = '.thumbnails/', targetExtension?: string): string {
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    const lastDotIndex = originalPath.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? originalPath.substring(0, lastDotIndex) : originalPath;
    const extension = (targetExtension || (lastDotIndex > 0 ? originalPath.slice(lastDotIndex + 1) : 'jpg')).replace(/^\./, '');
    const longestSide = this.resolveLongestSide(size);
    const descriptor = longestSide !== undefined ? `longest-${longestSide}` : `${size.width ?? 'auto'}x${size.height ?? 'auto'}`;
    return `${normalizedPrefix}${baseName}_${descriptor}.${extension}`;
  }

  static extractEtag(metadata: Record<string, any>): string {
    if (metadata.etag) {
      return metadata.etag;
    }
    if (metadata.versionId) {
      return metadata.versionId;
    }
    const size = metadata.contentLength || 0;
    const modified = metadata.lastModified ? new Date(metadata.lastModified).getTime() : 0;
    return Buffer.from(`${size}-${modified}`).toString('base64');
  }

  static async processImage(imageBuffer: Buffer, size: ThumbnailSize, quality = 80, targetFormatInfo?: TargetFormatInfo): Promise<ProcessedImageResult> {
    let pipeline = sharp(imageBuffer).withMetadata();

    const longestSide = this.resolveLongestSide(size);
    if (longestSide !== undefined) {
      pipeline = pipeline.resize({
        width: longestSide,
        height: longestSide,
        fit: 'inside',
        withoutEnlargement: true,
      });
    } else if (size.height && size.width) {
      pipeline = pipeline.resize(size.width, size.height, {
        fit: 'cover',
        withoutEnlargement: true,
      });
    } else if (size.width) {
      pipeline = pipeline.resize(size.width, undefined, {
        withoutEnlargement: true,
      });
    }

    const effectiveFormatInfo = targetFormatInfo || this.inferTargetFormatFromMetadata(await sharp(imageBuffer).metadata());
    const targetFormat = effectiveFormatInfo.format;

    switch (targetFormat) {
      case 'webp':
        pipeline = pipeline.toFormat('webp', { quality });
        break;
      case 'avif':
        pipeline = pipeline.toFormat('avif', { quality });
        break;
      case 'png':
        pipeline = pipeline.png();
        break;
      case 'jpg':
      case 'jpeg':
      default:
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
    }

    const buffer = await pipeline.toBuffer();

    return {
      buffer,
      format: targetFormat,
      contentType: effectiveFormatInfo.contentType,
    };
  }

  static generateThumbnailETag(originalETag: string, size: ThumbnailSize, thumbnailBuffer: Buffer) {
    const longestSide = this.resolveLongestSide(size);
    const descriptor = longestSide !== undefined ? `longest-${longestSide}` : `${size.width ?? 'auto'}x${size.height ?? 'auto'}`;
    const info = `${originalETag}-${descriptor}-${thumbnailBuffer.length}`;
    return Buffer.from(info).toString('base64');
  }

  static async getImageDimensions(imageBuffer: Buffer) {
    const metadata = await sharp(imageBuffer).metadata();
    return {
      width: metadata.width ?? 0,
      height: metadata.height ?? 0,
    };
  }

  static determineTargetFormat(originalPath: string): TargetFormatInfo {
    const extension = this.extractExtension(originalPath);
    const normalized = extension.toLowerCase() as SupportedFormat | '';

    if (normalized === 'webp') {
      return { format: 'webp', extension: 'webp', contentType: 'image/webp' };
    }
    if (normalized === 'avif') {
      return { format: 'avif', extension: 'avif', contentType: 'image/avif' };
    }
    if (normalized === 'png') {
      return { format: 'png', extension: 'png', contentType: 'image/png' };
    }
    if (normalized === 'jpg' || normalized === 'jpeg') {
      return { format: 'jpeg', extension: 'jpeg', contentType: 'image/jpeg' };
    }
    return { format: 'jpeg', extension: 'jpeg', contentType: 'image/jpeg' };
  }

  private static extractExtension(path: string) {
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex < 0) {
      return '';
    }
    return path.substring(lastDotIndex + 1);
  }

  private static inferTargetFormatFromMetadata(metadata: sharp.Metadata): TargetFormatInfo {
    const format = (metadata.format || 'jpeg').toLowerCase();
    switch (format) {
      case 'webp':
        return { format: 'webp', extension: 'webp', contentType: 'image/webp' };
      case 'avif':
        return { format: 'avif', extension: 'avif', contentType: 'image/avif' };
      case 'png':
        return { format: 'png', extension: 'png', contentType: 'image/png' };
      case 'jpg':
      case 'jpeg':
      default:
        return { format: 'jpeg', extension: 'jpeg', contentType: 'image/jpeg' };
    }
  }

  private static resolveLongestSide(size: ThumbnailSize): number | undefined {
    const mode = typeof size.mode === 'string' ? size.mode.toLowerCase() : undefined;
    const normalize = (value?: number) => (value && value > 0 ? Math.round(value) : undefined);
    const normalizedLongest = normalize(size.longestSide);
    const normalizedWidth = normalize(size.width);
    const normalizedHeight = normalize(size.height);

    if (mode === 'longest-edge') {
      return normalizedLongest ?? normalizedWidth ?? normalizedHeight;
    }
    if (normalizedLongest && !normalizedWidth && !normalizedHeight) {
      return normalizedLongest;
    }
    return undefined;
  }
}
