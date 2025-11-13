import { Logger } from '@nestjs/common';
import { buildPublicUrl } from './thumbnail.bucket-url';
import { ThumbnailGenerator } from './thumbnail.generator';
import { StorageOperations } from './thumbnail.storage';
import { BucketConfig, ThumbnailAppConfig, ThumbnailRequest, ThumbnailResult, ThumbnailSize } from './thumbnail.types';

export class ThumbnailCoreService {
  private readonly logger = new Logger(ThumbnailCoreService.name);

  constructor(private readonly appConfig: ThumbnailAppConfig) {}

  async getThumbnail(bucket: BucketConfig, request: ThumbnailRequest): Promise<ThumbnailResult> {
    const size = this.resolveThumbnailSize(request);

    if (bucket.capabilities.supportsUrlResize && bucket.capabilities.buildResizeUrl) {
      const resizeUrl = bucket.capabilities.buildResizeUrl(bucket, request.imagePath, size);
      return {
        url: resizeUrl,
        etag: '',
        isNewlyGenerated: false,
      };
    }

    const targetFormat = ThumbnailGenerator.determineTargetFormat(request.imagePath);
    const thumbnailPath = ThumbnailGenerator.getThumbnailPath(request.imagePath, size, bucket.thumbnailPrefix || '.thumbnails/', targetFormat.extension);

    const originalMetadata = await StorageOperations.getMetadata(bucket, request.imagePath);
    if (!originalMetadata) {
      throw new Error(`Original image not found: ${request.imagePath}`);
    }
    const originalETag = ThumbnailGenerator.extractEtag(originalMetadata);

    if (!request.forceRegenerate) {
      const cacheETag = await this.checkCache(bucket, thumbnailPath);
      if (cacheETag) {
        const cachedMetadata = await StorageOperations.getMetadata(bucket, thumbnailPath);
        if (cachedMetadata && this.isCacheValid(originalETag, cacheETag)) {
          const url = buildPublicUrl(bucket, thumbnailPath);
          return {
            url,
            etag: cacheETag,
            isNewlyGenerated: false,
          };
        }
      }
    }

    const originalBuffer = Buffer.from(await StorageOperations.readFile(bucket, request.imagePath));

    if (size.mode === 'longest-edge' && size.longestSide) {
      const dimensions = await ThumbnailGenerator.getImageDimensions(originalBuffer);
      const longestOriginal = Math.max(dimensions.width, dimensions.height);
      if (longestOriginal > 0 && longestOriginal <= size.longestSide) {
        const originalUrl = buildPublicUrl(bucket, request.imagePath);
        return {
          url: originalUrl,
          etag: originalETag,
          isNewlyGenerated: false,
        };
      }
    }

    const processedImage = await ThumbnailGenerator.processImage(originalBuffer, size, this.appConfig.quality, targetFormat);

    await StorageOperations.writeFile(bucket, thumbnailPath, processedImage.buffer, {
      contentType: processedImage.contentType,
    });

    const thumbnailETag = ThumbnailGenerator.generateThumbnailETag(originalETag, size, processedImage.buffer);
    const url = buildPublicUrl(bucket, thumbnailPath);

    return {
      url,
      etag: thumbnailETag,
      isNewlyGenerated: true,
    };
  }

  async clearThumbnailCache(bucket: BucketConfig, imagePath: string) {
    const thumbnailPrefix = bucket.thumbnailPrefix || '.thumbnails/';
    const baseName = imagePath.substring(0, imagePath.lastIndexOf('.'));
    const thumbnailFiles = await StorageOperations.listFiles(bucket, `${thumbnailPrefix}${baseName}`);
    for (const file of thumbnailFiles) {
      try {
        await StorageOperations.deleteFile(bucket, file);
      } catch (error) {
        this.logger.error(`Failed to delete thumbnail: ${file}`, error as Error);
      }
    }
  }

  private async checkCache(bucket: BucketConfig, thumbnailPath: string) {
    const exists = await StorageOperations.exists(bucket, thumbnailPath);
    if (!exists) {
      return null;
    }
    const metadata = await StorageOperations.getMetadata(bucket, thumbnailPath);
    if (!metadata) {
      return null;
    }
    return ThumbnailGenerator.extractEtag(metadata);
  }

  private isCacheValid(originalETag: string, cachedETag: string) {
    return cachedETag.includes(originalETag.substring(0, Math.min(originalETag.length, 10)));
  }

  private resolveThumbnailSize(request: ThumbnailRequest): ThumbnailSize {
    const sanitizedMode = typeof request.mode === 'string' ? request.mode.toLowerCase() : undefined;
    const explicitMode = sanitizedMode === 'longest-edge' || sanitizedMode === 'long' ? 'longest-edge' : sanitizedMode === 'exact' ? 'exact' : undefined;

    const normalizeDimension = (value?: number) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      const normalized = Math.round(value);
      return normalized > 0 ? normalized : undefined;
    };

    const width = normalizeDimension(request.width);
    const height = normalizeDimension(request.height);
    const longestSideValue = normalizeDimension(request.longestSide);

    if (explicitMode === 'longest-edge' || longestSideValue !== undefined) {
      const fallbackLongest = longestSideValue ?? width ?? height;
      if (!fallbackLongest || fallbackLongest <= 0) {
        throw new Error('Invalid longestSide: must be a positive integer');
      }
      return {
        mode: 'longest-edge',
        longestSide: fallbackLongest,
      };
    }

    if (!width || width <= 0) {
      throw new Error('Invalid width: must be a positive integer');
    }

    return {
      mode: 'exact',
      width,
      height,
    };
  }
}
