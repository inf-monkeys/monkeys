import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MediaBucketRegistryService } from './media.bucket-registry.service';
import { MediaPresignService } from './media.presign.service';

/**
 * 统一的 URL 转换服务
 *
 * 功能：自动检测 URL 是否来自私有桶，如果是则转换为预签名 URL
 *
 * 使用方式：
 * 1. 在 Repository 中：transformEntity(entity) 或 transformEntities(entities)
 * 2. 在 Service 中：transformUrl(url) 或 transformUrlsInObject(obj)
 */
@Injectable()
export class MediaUrlTransformerService {
  private readonly logger = new Logger(MediaUrlTransformerService.name);
  private static readonly DEFAULT_EXPIRES_IN = 3600; // 1小时

  constructor(
    private readonly bucketRegistry: MediaBucketRegistryService,
    private readonly presignService: MediaPresignService,
  ) {}

  /**
   * 转换单个 URL（如果来自私有桶则返回预签名 URL）
   */
  async transformUrl(url: string | null | undefined, expiresIn: number = MediaUrlTransformerService.DEFAULT_EXPIRES_IN): Promise<string | null | undefined> {
    if (!url || typeof url !== 'string' || !this.isHttpUrl(url)) {
      return url;
    }

    try {
      // 尝试解析并检查是否是注册的桶
      const urlObj = new URL(url);
      const resolved = this.bucketRegistry.resolveBucketFromUrl(urlObj);

      if (!resolved) {
        // 不是注册的桶，返回原URL
        return url;
      }

      // 是注册的桶，生成预签名URL
      const result = await this.presignService.getPresignedUrl(url, expiresIn);
      return result.signedUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        return url;
      }
      this.logger.warn(`Failed to transform URL ${url}: ${error.message}`);
      return url;
    }
  }

  /**
   * 批量转换 URL 数组
   */
  async transformUrls(urls: (string | null | undefined)[], expiresIn?: number): Promise<(string | null | undefined)[]> {
    return Promise.all(urls.map(url => this.transformUrl(url, expiresIn)));
  }

  /**
   * 转换对象中指定的 URL 字段
   */
  async transformUrlsInObject<T extends Record<string, any>>(
    obj: T | null | undefined,
    urlFields: string[],
    expiresIn?: number
  ): Promise<T | null | undefined> {
    if (!obj) {
      return obj;
    }

    const result: any = { ...obj };

    for (const field of urlFields) {
      if (field in result && typeof result[field] === 'string') {
        result[field] = await this.transformUrl(result[field], expiresIn);
      }
    }

    return result as T;
  }

  /**
   * 批量转换对象数组
   */
  async transformUrlsInObjects<T extends Record<string, any>>(
    objects: T[],
    urlFields: string[],
    expiresIn?: number
  ): Promise<T[]> {
    return Promise.all(
      objects.map(obj => this.transformUrlsInObject(obj, urlFields, expiresIn))
    );
  }

  private isHttpUrl(str: string): boolean {
    return str.startsWith('http://') || str.startsWith('https://');
  }
}
