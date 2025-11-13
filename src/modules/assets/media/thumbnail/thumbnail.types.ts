import { S3ThumbnailBucketConfig } from '@/common/config';

export interface ThumbnailSize {
  mode?: 'exact' | 'longest-edge';
  width?: number;
  height?: number;
  longestSide?: number;
}

export interface ThumbnailRequest {
  imagePath: string;
  mode?: 'exact' | 'longest-edge';
  width?: number;
  height?: number;
  longestSide?: number;
  forceRegenerate?: boolean;
}

export interface ThumbnailResult {
  url: string;
  etag: string;
  isNewlyGenerated: boolean;
}

export interface ProviderCapabilities {
  supportsUrlResize: boolean;
  buildResizeUrl?: (bucket: BucketConfig, imagePath: string, size: ThumbnailSize) => string;
}

export interface BucketConfig extends S3ThumbnailBucketConfig {
  capabilities: ProviderCapabilities;
}

export interface BucketResolution {
  bucket: BucketConfig;
  imagePath: string;
  matchedPatternId?: string;
}

export interface ThumbnailAppConfig {
  quality: number;
}
