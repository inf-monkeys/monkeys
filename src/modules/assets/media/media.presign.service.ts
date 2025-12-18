import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MediaBucketRegistryService } from './media.bucket-registry.service';
import { StorageOperations } from './thumbnail/thumbnail.storage';

export interface MediaPresignResult {
  bucketId: string;
  signedUrl: string;
  expiresIn: number;
  method: string;
  headers: Record<string, string>;
  matchedPatternId?: string;
  imagePath: string;
  originalUrl: string;
}

interface CachedPresignResult extends MediaPresignResult {
  cachedAt: number; // 缓存时间戳
}

@Injectable()
export class MediaPresignService {
  private static readonly DEFAULT_EXPIRES_IN_SECONDS = 300;
  private readonly logger = new Logger(MediaPresignService.name);

  // URL缓存，key为原始URL，value为预签名结果
  private readonly urlCache = new Map<string, CachedPresignResult>();

  // 缓存清理间隔（5分钟）
  private readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000;

  constructor(private readonly bucketRegistry: MediaBucketRegistryService) {
    // 启动定期清理过期缓存的任务
    this.startCacheCleanup();
  }

  async getPresignedUrl(targetUrl: string, expiresInSeconds?: number): Promise<MediaPresignResult> {
    const normalizedExpires = this.normalizeExpires(expiresInSeconds);

    // 检查缓存
    const cacheKey = `${targetUrl}:${normalizedExpires}`;
    const cached = this.urlCache.get(cacheKey);

    if (cached) {
      const now = Date.now();
      const cacheAge = now - cached.cachedAt;
      const remainingTime = (normalizedExpires * 1000) - cacheAge;

      // 如果缓存还有至少30%的有效期，则使用缓存
      if (remainingTime > (normalizedExpires * 1000 * 0.3)) {
        this.logger.debug(`Using cached presigned URL for ${targetUrl} (remaining: ${Math.round(remainingTime / 1000)}s)`);
        const { cachedAt, ...result } = cached;
        return result;
      } else {
        // 缓存即将过期，删除它
        this.urlCache.delete(cacheKey);
      }
    }

    // 生成新的预签名URL
    const resolved = this.resolveBucket(targetUrl);
    let presigned;
    try {
      presigned = await StorageOperations.presignRead(resolved.bucket, resolved.imagePath, normalizedExpires);
    } catch (error: any) {
      const message = error?.message || 'presign failed';
      this.logger.error(`Presign read failed for bucket ${resolved.bucket.id}, path ${resolved.imagePath}: ${message}`);
      // 将底层错误包装为 BadRequest 便于前端展示具体原因
      throw new BadRequestException(`获取预签名链接失败: ${message}`);
    }

    this.logger.debug(`Generated new presigned URL for ${resolved.imagePath}: ${presigned.url}`);

    const result: MediaPresignResult = {
      bucketId: resolved.bucket.id,
      signedUrl: presigned.url,
      expiresIn: normalizedExpires,
      method: presigned.method,
      headers: presigned.headers,
      matchedPatternId: resolved.matchedPatternId,
      imagePath: resolved.imagePath,
      originalUrl: targetUrl,
    };

    // 缓存结果
    this.urlCache.set(cacheKey, {
      ...result,
      cachedAt: Date.now(),
    });

    return result;
  }

  private resolveBucket(url: string) {
    if (!url) {
      throw new BadRequestException('url 参数必填');
    }
    let urlObject: URL;
    try {
      urlObject = new URL(url);
    } catch (error) {
      throw new BadRequestException('url 参数格式不正确');
    }

    const resolved = this.bucketRegistry.resolveBucketFromUrl(urlObject);
    if (!resolved) {
      throw new NotFoundException(`未找到可用的缩略图存储桶: ${url}`);
    }
    if (!resolved.imagePath) {
      throw new BadRequestException('无法从指定 URL 中解析出文件路径');
    }
    return resolved;
  }

  private normalizeExpires(value?: number) {
    if (value === undefined || value === null) {
      return MediaPresignService.DEFAULT_EXPIRES_IN_SECONDS;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return MediaPresignService.DEFAULT_EXPIRES_IN_SECONDS;
    }
    return Math.round(parsed);
  }

  /**
   * 启动定期清理过期缓存的任务
   */
  private startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * 清理过期的缓存项
   */
  private cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.urlCache.entries()) {
      const cacheAge = now - cached.cachedAt;
      const remainingTime = (cached.expiresIn * 1000) - cacheAge;

      // 如果缓存已过期或即将过期（剩余时间少于10%），删除它
      if (remainingTime <= (cached.expiresIn * 1000 * 0.1)) {
        this.urlCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired presigned URL cache entries`);
    }
  }
}
