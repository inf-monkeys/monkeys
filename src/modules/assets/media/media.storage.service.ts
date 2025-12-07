import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import { generateId } from 'ai';
import { MediaBucketRegistryService } from './media.bucket-registry.service';
import { buildPublicUrl } from './thumbnail/thumbnail.bucket-url';
import { StorageOperations } from './thumbnail/thumbnail.storage';

export interface UploadFileOptions {
  key: string;
  buffer: Buffer;
  contentType?: string;
  randomFilename?: boolean;
}

export interface UploadResult {
  url: string;
  canonicalUrl: string;
  key: string;
  bucketId: string;
}

export interface PresignUploadOptions {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}

export interface PresignUploadResult {
  url: string;
  method: string;
  headers: Record<string, string>;
  key: string;
  bucketId: string;
  expiresIn: number;
}

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);
  private static readonly DEFAULT_UPLOAD_EXPIRES = 300; // 5分钟

  constructor(private readonly bucketRegistry: MediaBucketRegistryService) {}

  /**
   * 直接上传文件到存储（服务器端上传）
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    let { key } = options;
    const { buffer, contentType, randomFilename } = options;

    // 处理随机文件名
    if (randomFilename || config.s3.randomFilename) {
      const suffix = key.split('.').pop()?.toLowerCase();
      const id = generateId();
      key = `r/${id}.${suffix}`;
    }

    // 获取主存储桶（使用第一个配置的桶，或默认桶）
    const bucket = this.bucketRegistry.getPrimaryBucket();
    if (!bucket) {
      throw new Error('未配置存储桶，请联系管理员');
    }

    // 使用 opendal 上传文件
    await StorageOperations.writeFile(bucket, key, buffer, {
      contentType,
    });

    // 上传成功；如需调试可改回 debug

    // 构建公开访问 URL
    const publicUrl = buildPublicUrl(bucket, key);

    // 如果是私有桶，返回预签名 URL
    if (config.s3.isPrivate) {
      const presigned = await StorageOperations.presignRead(bucket, key, 259200); // 3天有效期
      return {
        url: presigned.url,
        canonicalUrl: publicUrl,
        key,
        bucketId: bucket.id,
      };
    }

    return {
      url: publicUrl,
      canonicalUrl: publicUrl,
      key,
      bucketId: bucket.id,
    };
  }

  /**
   * 获取上传预签名 URL（客户端直传）
   */
  async getPresignedUploadUrl(options: PresignUploadOptions): Promise<PresignUploadResult> {
    const { key, expiresInSeconds = MediaStorageService.DEFAULT_UPLOAD_EXPIRES } = options;

    // 获取主存储桶
    const bucket = this.bucketRegistry.getPrimaryBucket();
    if (!bucket) {
      throw new Error('未配置存储桶，请联系管理员');
    }

    // 使用 opendal 生成上传预签名 URL
    const presigned = await StorageOperations.presignWrite(bucket, key, expiresInSeconds);

    return {
      url: presigned.url,
      method: presigned.method,
      headers: presigned.headers || {},
      key,
      bucketId: bucket.id,
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    const bucket = this.bucketRegistry.getPrimaryBucket();
    if (!bucket) {
      throw new Error('未配置存储桶，请联系管理员');
    }

    await StorageOperations.deleteFile(bucket, key);
    this.logger.debug(`文件已删除: ${key}`);
  }

  /**
   * 获取文件访问 URL
   */
  async getFileUrl(key: string): Promise<string> {
    const bucket = this.bucketRegistry.getPrimaryBucket();
    if (!bucket) {
      throw new Error('未配置存储桶，请联系管理员');
    }

    // 如果是公开桶，直接返回公开 URL
    if (!config.s3.isPrivate) {
      return buildPublicUrl(bucket, key);
    }

    // 私有桶返回预签名 URL
    const presigned = await StorageOperations.presignRead(bucket, key, 259200);
    return presigned.url;
  }
}
