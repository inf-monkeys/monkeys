import { extractImagePathFromUrl, ResolvedBucketUrlPattern } from './thumbnail.bucket-url';
import { BucketConfig, BucketResolution } from './thumbnail.types';

export class BucketManager {
  private readonly buckets = new Map<string, BucketConfig>();
  private readonly urlPatternRegistry: Array<{
    bucketId: string;
    hostname: string;
    pattern: ResolvedBucketUrlPattern;
  }> = [];

  registerBucket(config: BucketConfig) {
    this.buckets.set(config.id, config);
    for (const pattern of config.urlPatterns) {
      this.urlPatternRegistry.push({
        bucketId: config.id,
        hostname: pattern.hostname.toLowerCase(),
        pattern,
      });
    }
  }

  clear() {
    this.buckets.clear();
    this.urlPatternRegistry.length = 0;
  }

  getBucketById(id: string) {
    return this.buckets.get(id);
  }

  resolveBucketFromUrl(targetUrl: URL): BucketResolution | undefined {
    for (const entry of this.urlPatternRegistry) {
      const bucket = this.buckets.get(entry.bucketId);
      if (!bucket) {
        continue;
      }

      const imagePath = extractImagePathFromUrl(entry.pattern, targetUrl);
      if (imagePath !== null) {
        return {
          bucket,
          imagePath,
          matchedPatternId: entry.pattern.id,
        };
      }
    }
    return undefined;
  }

  getAllBuckets(): BucketConfig[] {
    return Array.from(this.buckets.values());
  }
}
