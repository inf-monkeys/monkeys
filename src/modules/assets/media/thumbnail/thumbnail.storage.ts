import { Operator } from 'opendal';
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

  static async writeFile(bucket: BucketConfig, path: string, data: Uint8Array | Buffer, options?: { contentType?: string }) {
    const operator = await storageClientCache.getOperator(bucket);
    const bufferData = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const writeOptions = options?.contentType ? { contentType: options.contentType } : undefined;
    await operator.write(path, bufferData, writeOptions);
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
}
