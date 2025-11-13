import { config } from '@/common/config';
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { BucketManager } from './thumbnail/thumbnail.bucket-manager';
import { ThumbnailCoreService } from './thumbnail/thumbnail.core';
import { resolveProviderCapabilities } from './thumbnail/thumbnail.provider-capabilities';
import { BucketConfig, ThumbnailAppConfig, ThumbnailRequest, ThumbnailResult } from './thumbnail/thumbnail.types';

export interface GetThumbnailOptions {
  url: string;
  mode?: 'exact' | 'longest-edge';
  width?: number;
  height?: number;
  longestSide?: number;
  forceRegenerate?: boolean;
}

export interface ThumbnailWithMeta extends ThumbnailResult {
  bucketId: string;
  shouldRedirect: boolean;
  matchedPatternId?: string;
}

@Injectable()
export class MediaThumbnailService implements OnModuleInit {
  private readonly logger = new Logger(MediaThumbnailService.name);
  private readonly bucketManager = new BucketManager();
  private readonly thumbnailCore: ThumbnailCoreService;

  constructor() {
    const quality = Number(config.s3Thumbnail?.quality ?? 80);
    const thumbnailConfig: ThumbnailAppConfig = {
      quality: Number.isFinite(quality) ? quality : 80,
    };
    this.thumbnailCore = new ThumbnailCoreService(thumbnailConfig);
  }

  onModuleInit() {
    this.initializeBuckets();
  }

  async getThumbnailByUrl(options: GetThumbnailOptions): Promise<ThumbnailWithMeta> {
    const { url, ...rest } = options;
    if (!url) {
      throw new BadRequestException('url 参数必填');
    }

    let urlObject: URL;
    try {
      urlObject = new URL(url);
    } catch (error) {
      throw new BadRequestException('url 参数格式不正确');
    }

    const resolved = this.bucketManager.resolveBucketFromUrl(urlObject);
    if (!resolved) {
      throw new NotFoundException(`未找到可用的缩略图存储桶: ${url}`);
    }

    if (!resolved.imagePath) {
      throw new BadRequestException('无法从指定 URL 中解析出文件路径');
    }

    const request = this.buildThumbnailRequest(resolved.imagePath, rest);
    const result = await this.thumbnailCore.getThumbnail(resolved.bucket, request);

    return {
      ...result,
      bucketId: resolved.bucket.id,
      shouldRedirect: resolved.bucket.capabilities.supportsUrlResize ?? false,
      matchedPatternId: resolved.matchedPatternId,
    };
  }

  private initializeBuckets() {
    this.bucketManager.clear();
    if (!config.s3ThumbnailBuckets?.length) {
      this.logger.warn('未在配置中发现 s3-thumb-buckets，缩略图服务将不可用');
      return;
    }
    for (const rawBucket of config.s3ThumbnailBuckets) {
      const bucket = this.buildBucketConfig(rawBucket);
      this.bucketManager.registerBucket(bucket);
    }
  }

  private buildBucketConfig(rawBucket: (typeof config.s3ThumbnailBuckets)[number]): BucketConfig {
    const bucket: BucketConfig = {
      ...rawBucket,
      capabilities: {
        supportsUrlResize: false,
      },
    };
    bucket.capabilities = resolveProviderCapabilities(rawBucket.provider, bucket);
    return bucket;
  }

  private buildThumbnailRequest(imagePath: string, options: Omit<GetThumbnailOptions, 'url'>): ThumbnailRequest {
    const sanitizeNumber = (value?: number) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (Number.isNaN(value)) {
        return undefined;
      }
      const rounded = Math.round(value);
      return rounded > 0 ? rounded : undefined;
    };

    const mode = options.mode === 'exact' || options.mode === 'longest-edge' ? options.mode : undefined;
    const width = sanitizeNumber(options.width);
    const height = sanitizeNumber(options.height);
    const longestSide = sanitizeNumber(options.longestSide);

    if (!mode && !width && !height && !longestSide) {
      return {
        imagePath,
        mode: 'longest-edge',
        longestSide: 200,
        forceRegenerate: options.forceRegenerate,
      };
    }

    return {
      imagePath,
      mode,
      width,
      height,
      longestSide,
      forceRegenerate: options.forceRegenerate,
    };
  }
}
