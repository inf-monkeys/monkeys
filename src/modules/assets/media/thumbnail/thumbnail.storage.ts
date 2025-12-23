import { Operator, type PresignedRequest, type WriteOptions } from 'opendal';
import { BucketConfig } from './thumbnail.types';

class StorageClientCache {
  private readonly cache = new Map<string, Operator>();

  async getOperator(bucket: BucketConfig) {
    const cacheKey = bucket.id;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    const operator = new Operator(bucket.provider, bucket.config);
    this.cache.set(cacheKey, operator);
    return operator;
  }

  clear() {
    this.cache.clear();
  }
}

export const storageClientCache = new StorageClientCache();

export class StorageOperations {
  static async readFile(bucket: BucketConfig, path: string): Promise<Uint8Array> {
    const operator = await storageClientCache.getOperator(bucket);
    return operator.read(path) as unknown as Uint8Array;
  }

  static async writeFile(bucket: BucketConfig, path: string, data: Uint8Array | Buffer, options?: { contentType?: string; metadata?: Record<string, string> }) {
    const operator = await storageClientCache.getOperator(bucket);
    const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const writeOptions: WriteOptions = {};

    if (options?.contentType) {
      writeOptions.contentType = options.contentType;
    }
    if (options?.metadata && Object.keys(options.metadata).length > 0) {
      writeOptions.userMetadata = options.metadata;
    }

    await operator.write(path, bufferData, Object.keys(writeOptions).length > 0 ? writeOptions : undefined);
  }

  static async getMetadata(bucket: BucketConfig, path: string): Promise<Record<string, any> | null> {
    const operator = await storageClientCache.getOperator(bucket);
    try {
      const stat = await operator.stat(path);
      return {
        contentLength: stat.contentLength,
        lastModified: stat.lastModified,
        etag: stat.etag,
        versionId: (stat as any).versionId,
        userMetadata: stat.userMetadata ?? undefined,
      };
    } catch (error: any) {
      const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
      const serialized = typeof error?.toString === 'function' ? String(error.toString()).toLowerCase() : message;
      if (error?.code === 'NotFound' || error?.status === 404 || message.includes('not found') || serialized.includes('notfound')) {
        return null;
      }
      throw error;
    }
  }

  static async exists(bucket: BucketConfig, path: string) {
    const metadata = await this.getMetadata(bucket, path);
    return metadata !== null;
  }

  static async deleteFile(bucket: BucketConfig, path: string) {
    const operator = await storageClientCache.getOperator(bucket);
    await operator.delete(path);
  }

  static async listFiles(bucket: BucketConfig, prefix: string) {
    const operator = await storageClientCache.getOperator(bucket);
    const files: string[] = [];
    try {
      const entries = await operator.list(prefix);
      for await (const entry of entries) {
        const path = typeof entry.path === 'function' ? (entry.path as () => string)() : String(entry.path);
        files.push(path);
      }
    } catch (error) {
      console.error(`Error listing files in ${prefix}:`, error);
    }
    return files;
  }

  static async presignRead(bucket: BucketConfig, path: string, expiresInSeconds: number): Promise<PresignedRequest> {
    const operator = await storageClientCache.getOperator(bucket);
    try {
      return await operator.presignRead(path, expiresInSeconds);
    } catch (error: any) {
      throw new Error(`Bucket ${bucket.id} presignRead 失败: ${error.message}`);
    }
  }

  static async presignWrite(bucket: BucketConfig, path: string, expiresInSeconds: number): Promise<PresignedRequest> {
    const operator = await storageClientCache.getOperator(bucket);
    const capability = operator.capability();

    // 记录 capability 信息用于调试
    console.log(`Bucket ${bucket.id} (${bucket.provider}) capabilities:`, {
      presign: capability.presign,
      presignRead: capability.presignRead,
      presignWrite: capability.presignWrite,
      presignStat: capability.presignStat,
    });

    // 尝试直接调用 presignWrite，让 opendal 自己处理是否支持
    try {
      const presignedRequest = await operator.presignWrite(path, expiresInSeconds);

      // Azure Blob Storage 需要 x-ms-blob-type header 才能上传
      // OpenDAL 目前无法在 SAS token 中嵌入此 header，所以我们在返回的 headers 中添加
      // 参考: https://github.com/apache/opendal/issues/6274
      if (bucket.provider === 'azblob') {
        presignedRequest.headers = {
          ...presignedRequest.headers,
          'x-ms-blob-type': 'BlockBlob',
        };
      }

      return presignedRequest;
    } catch (error) {
      // 如果真的不支持，会抛出错误
      throw new Error(`Bucket ${bucket.id} presignWrite 失败: ${error.message}`);
    }
  }
}
