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

@Injectable()
export class MediaPresignService {
  private static readonly DEFAULT_EXPIRES_IN_SECONDS = 300;
  private readonly logger = new Logger(MediaPresignService.name);

  constructor(private readonly bucketRegistry: MediaBucketRegistryService) {}

  async getPresignedUrl(targetUrl: string, expiresInSeconds?: number): Promise<MediaPresignResult> {
    const normalizedExpires = this.normalizeExpires(expiresInSeconds);
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

    this.logger.debug(`Generated presigned URL for ${resolved.imagePath}: ${presigned.url}`);

    return {
      bucketId: resolved.bucket.id,
      signedUrl: presigned.url,
      expiresIn: normalizedExpires,
      method: presigned.method,
      headers: presigned.headers,
      matchedPatternId: resolved.matchedPatternId,
      imagePath: resolved.imagePath,
      originalUrl: targetUrl,
    };
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
}
