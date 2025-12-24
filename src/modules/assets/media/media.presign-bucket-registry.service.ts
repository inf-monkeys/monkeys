import { config, S3PresignBucketConfig } from '@/common/config';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BucketManager } from './thumbnail/thumbnail.bucket-manager';
import { resolveProviderCapabilities } from './thumbnail/thumbnail.provider-capabilities';
import { BucketConfig, BucketResolution } from './thumbnail/thumbnail.types';

@Injectable()
export class MediaPresignBucketRegistryService implements OnModuleInit {
  private readonly logger = new Logger(MediaPresignBucketRegistryService.name);
  private readonly bucketManager = new BucketManager();

  onModuleInit() {
    this.initializeBuckets();
  }

  resolveBucketFromUrl(targetUrl: URL): BucketResolution | undefined {
    return this.bucketManager.resolveBucketFromUrl(targetUrl);
  }

  getBucketById(id: string): BucketConfig | undefined {
    return this.bucketManager.getBucketById(id);
  }

  getAllBuckets(): BucketConfig[] {
    return this.bucketManager.getAllBuckets();
  }

  getPrimaryBucket(): BucketConfig | undefined {
    const buckets = this.bucketManager.getAllBuckets();
    return buckets.length > 0 ? buckets[0] : undefined;
  }

  private initializeBuckets() {
    this.bucketManager.clear();
    if (!config.s3PresignBuckets?.length) {
      this.logger.warn('未在配置中发现 s3-presign-buckets，前端预签名将不生效');
      return;
    }

    for (const rawBucket of config.s3PresignBuckets) {
      const bucket = this.buildBucketConfig(rawBucket);
      this.bucketManager.registerBucket(bucket);
    }
  }

  private buildBucketConfig(rawBucket: S3PresignBucketConfig): BucketConfig {
    const bucket: BucketConfig = {
      ...rawBucket,
      capabilities: {
        supportsUrlResize: false,
      },
    };
    bucket.capabilities = resolveProviderCapabilities(rawBucket.provider, bucket);
    return bucket;
  }
}
