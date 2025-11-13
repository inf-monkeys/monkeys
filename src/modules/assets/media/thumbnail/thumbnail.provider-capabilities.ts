import { BucketConfig, ProviderCapabilities, ThumbnailSize } from './thumbnail.types';
import { buildPublicUrl } from './thumbnail.bucket-url';

type ProviderCapabilityFactory = (bucket: BucketConfig) => ProviderCapabilities;

const DEFAULT_CAPABILITIES: ProviderCapabilities = {
  supportsUrlResize: false,
};

const PROVIDER_RESIZE_ALLOWLIST: Record<string, Set<string>> = {
  oss: new Set(['oss-93-monkeys']),
};

const providerFactories: Record<string, ProviderCapabilityFactory> = {
  oss: (bucket) => {
    const allowlist = PROVIDER_RESIZE_ALLOWLIST.oss;
    const enabled = allowlist?.has(bucket.id) ?? false;

    if (!enabled) {
      return DEFAULT_CAPABILITIES;
    }

    return {
      supportsUrlResize: true,
      buildResizeUrl: (currentBucket, imagePath, size: ThumbnailSize) => {
        const originalUrl = buildPublicUrl(currentBucket, imagePath);
        if (size.mode === 'longest-edge' && size.longestSide) {
          return `${originalUrl}?x-oss-process=image/resize,l_${size.longestSide}`;
        }
        const width = size.width ?? size.longestSide;
        if (!width) {
          throw new Error('OSS resize 需要指定宽度或最长边');
        }
        const height = size.height ? `,h_${size.height}` : '';
        return `${originalUrl}?x-oss-process=image/resize,w_${width}${height}`;
      },
    };
  },
  s3: () => DEFAULT_CAPABILITIES,
};

export const resolveProviderCapabilities = (provider: string, bucket: BucketConfig): ProviderCapabilities => {
  const factory = providerFactories[provider];
  if (!factory) {
    return DEFAULT_CAPABILITIES;
  }
  return factory(bucket);
};


