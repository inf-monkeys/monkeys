import { BucketConfig } from './thumbnail.types';

export interface ResolvedBucketUrlPattern {
  id: string;
  type: 'bucket-hostname' | 'provider-hostname';
  hostname: string;
  preferred?: boolean;
  bucketSegment?: string;
}

export const getPreferredUrlPattern = (bucket: BucketConfig): ResolvedBucketUrlPattern => {
  const preferred =
    bucket.urlPatterns.find((pattern) => pattern.id === bucket.preferredUrlPatternId) ||
    bucket.urlPatterns.find((pattern) => pattern.preferred);

  if (!preferred) {
    throw new Error(`Bucket ${bucket.id} 未配置首选 URL 样式`);
  }

  return preferred;
};

export const getUrlPatternById = (bucket: BucketConfig, patternId: string): ResolvedBucketUrlPattern | undefined => {
  return bucket.urlPatterns.find((pattern) => pattern.id === patternId);
};

export const buildPublicUrl = (bucket: BucketConfig, objectPath: string, options?: { patternId?: string }) => {
  const pattern = options?.patternId ? getUrlPatternById(bucket, options.patternId) || getPreferredUrlPattern(bucket) : getPreferredUrlPattern(bucket);

  const cleanPath =
    objectPath.startsWith('/') && objectPath.length > 1 ? objectPath.slice(1) : objectPath === '/' ? '' : objectPath;

  const baseUrl = `https://${pattern.hostname}`;

  if (pattern.type === 'bucket-hostname') {
    if (!cleanPath) {
      return baseUrl;
    }
    return `${baseUrl}/${cleanPath}`;
  }

  const bucketSegment = pattern.bucketSegment;
  if (!bucketSegment) {
    throw new Error(`Bucket ${bucket.id} 的 provider-hostname 模式缺少 bucketSegment 配置`);
  }

  if (!cleanPath) {
    return `${baseUrl}/${bucketSegment}`;
  }

  return `${baseUrl}/${bucketSegment}/${cleanPath}`;
};

export const extractImagePathFromUrl = (pattern: ResolvedBucketUrlPattern, url: URL): string | null => {
  if (url.hostname.toLowerCase() !== pattern.hostname.toLowerCase()) {
    return null;
  }

  const pathname = decodeURIComponent(url.pathname || '');
  const trimmedPath = pathname.replace(/^\/+/, '');

  if (pattern.type === 'bucket-hostname') {
    return trimmedPath;
  }

  const bucketSegment = pattern.bucketSegment;
  if (!bucketSegment) {
    return null;
  }

  if (!trimmedPath) {
    return '';
  }

  if (trimmedPath === bucketSegment) {
    return '';
  }

  if (trimmedPath.startsWith(`${bucketSegment}/`)) {
    return trimmedPath.slice(bucketSegment.length + 1);
  }

  return null;
};


