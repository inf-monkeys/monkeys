import { getStoredToken } from '@/apis/auth-storage';
import type { SystemConfig } from '@/apis/system-config';

const DEFAULT_EXPIRES_IN_SECONDS = 300;
const MAX_CONCURRENT_REQUESTS = 5;
const FETCH_PATCH_FLAG = '__monkeysAdminOssPresignFetchPatched__';
const PROCESSING_FLAG = '__monkeysOssPresignProcessing__';

type PresignConfig = NonNullable<NonNullable<SystemConfig['storage']>['presign']>;
type PresignBucket = NonNullable<PresignConfig>['buckets'][number];
type PresignUrlPattern = PresignBucket['urlPatterns'][number];

type SignedCacheEntry = {
  url: string;
  expiresIn: number;
  timestamp: number;
};

let cachedConfig: PresignConfig | null = null;
let configPromise: Promise<PresignConfig | null> | null = null;
let interceptorsInitialized = false;
let configLoaded = false;

const signedUrlCache = new Map<string, SignedCacheEntry>();
const inflightPresign = new Map<string, Promise<string>>();
const requestQueue: Array<() => void> = [];
let activeRequests = 0;

const processingElements = new WeakSet<Element>();

const shouldSkipTransformForUrl = (url: string) =>
  url.includes('/api/configs') || url.includes('/api/medias/s3/presign-v2');

const isHttpUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');

const isSignedUrl = (value: string) => {
  const lower = value.toLowerCase();
  return lower.includes('x-amz-') || lower.includes('x-oss-signature');
};

const hasQueryString = (value: string) => value.includes('?');

const sanitizePresignConfig = (config?: PresignConfig | null): PresignConfig | null => {
  if (!config || !Array.isArray(config.buckets)) {
    return null;
  }

  const expiresRaw = Number(config.expiresInSeconds);
  const expiresInSeconds = Number.isFinite(expiresRaw) && expiresRaw > 0 ? Math.round(expiresRaw) : DEFAULT_EXPIRES_IN_SECONDS;

  const buckets = config.buckets
    .filter((bucket) => bucket && Array.isArray(bucket.urlPatterns))
    .map((bucket) => ({
      id: String(bucket.id || ''),
      provider: String(bucket.provider || ''),
      preferredUrlPatternId: String(bucket.preferredUrlPatternId || ''),
      urlPatterns: bucket.urlPatterns
        .filter((pattern) => pattern && pattern.hostname && pattern.type)
        .map((pattern) => ({
          id: String(pattern.id || ''),
          type: pattern.type,
          hostname: String(pattern.hostname || '').toLowerCase(),
          preferred: Boolean(pattern.preferred),
          bucketSegment: pattern.bucketSegment ? String(pattern.bucketSegment) : undefined,
        })),
    }))
    .filter((bucket) => bucket.id && bucket.urlPatterns.length > 0);

  return { expiresInSeconds, buckets };
};

export const setPresignConfig = (config?: PresignConfig | null) => {
  cachedConfig = sanitizePresignConfig(config);
  configLoaded = true;
  signedUrlCache.clear();
  inflightPresign.clear();
  if (typeof window !== 'undefined') {
    scanDocument();
  }
};

const loadPresignConfig = async (): Promise<PresignConfig | null> => {
  if (configLoaded) {
    return cachedConfig;
  }
  if (configPromise) {
    return configPromise;
  }

  configPromise = (async () => {
    try {
      const response = await fetch('/api/configs', {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
      });
      if (!response.ok) return null;
      const json = await response.json().catch(() => null);
      const data = json && typeof json === 'object' && 'data' in json ? (json as any).data : json;
      const presign = data?.storage?.presign;
      cachedConfig = sanitizePresignConfig(presign);
      configLoaded = true;
      return cachedConfig;
    } catch {
      configLoaded = true;
      return null;
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
};

const matchesPattern = (pattern: PresignUrlPattern, url: URL) => {
  if (url.hostname.toLowerCase() !== pattern.hostname) {
    return false;
  }

  if (pattern.type === 'bucket-hostname') {
    return true;
  }

  const bucketSegment = pattern.bucketSegment;
  if (!bucketSegment) {
    return false;
  }

  const pathname = decodeURIComponent(url.pathname || '');
  const trimmedPath = pathname.replace(/^\/+/, '');

  if (!trimmedPath) {
    return false;
  }

  if (trimmedPath === bucketSegment) {
    return true;
  }

  return trimmedPath.startsWith(`${bucketSegment}/`);
};

const shouldPresignUrlWithConfig = (value: string, config: PresignConfig | null) => {
  if (!config || config.buckets.length === 0) {
    return false;
  }
  if (!isHttpUrl(value)) {
    return false;
  }
  if (hasQueryString(value)) {
    return false;
  }
  if (isSignedUrl(value)) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return config.buckets.some((bucket) => bucket.urlPatterns.some((pattern) => matchesPattern(pattern, url)));
};

const shouldPresignUrlSync = (value: string) => shouldPresignUrlWithConfig(value, cachedConfig);

const buildAuthHeaders = (): Record<string, string> => {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isCacheValid = (entry: SignedCacheEntry) => {
  const ttl = entry.expiresIn > 0 ? entry.expiresIn : DEFAULT_EXPIRES_IN_SECONDS;
  const safeTtl = Math.max(60, Math.round(ttl * 0.9));
  return Date.now() < entry.timestamp + safeTtl * 1000;
};

const enqueuePresign = (task: () => Promise<string>) =>
  new Promise<string>((resolve, reject) => {
    const execute = async () => {
      activeRequests += 1;
      try {
        resolve(await task());
      } catch (error) {
        reject(error);
      } finally {
        activeRequests -= 1;
        if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
          const next = requestQueue.shift();
          next?.();
        }
      }
    };

    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      execute();
    } else {
      requestQueue.push(execute);
    }
  });

const requestPresignedUrl = async (url: string, config: PresignConfig): Promise<string> => {
  const cacheKey = url;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    return cached.url;
  }

  const requestUrl = `/api/medias/s3/presign-v2?url=${encodeURIComponent(url)}&redirect=false`;
  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        ...buildAuthHeaders(),
      },
    });
    if (!response.ok) {
      return url;
    }
    const json = await response.json().catch(() => null);
    const payload = json && typeof json === 'object' && 'data' in json ? (json as any).data : json;
    if (!payload || typeof payload !== 'object') {
      return url;
    }
    const signedUrl = payload.signedUrl;
    if (typeof signedUrl !== 'string' || signedUrl.length === 0) {
      return url;
    }
    const expiresRaw = Number(payload.expiresIn ?? config.expiresInSeconds);
    const expiresIn = Number.isFinite(expiresRaw) && expiresRaw > 0 ? Math.round(expiresRaw) : config.expiresInSeconds;
    signedUrlCache.set(cacheKey, {
      url: signedUrl,
      expiresIn,
      timestamp: Date.now(),
    });
    return signedUrl;
  } catch {
    return url;
  }
};

const presignUrl = async (value: string): Promise<string> => {
  if (!isHttpUrl(value) || hasQueryString(value) || isSignedUrl(value)) {
    return value;
  }
  const config = await loadPresignConfig();
  if (!shouldPresignUrlWithConfig(value, config)) {
    return value;
  }

  const cacheKey = value;
  if (inflightPresign.has(cacheKey)) {
    return inflightPresign.get(cacheKey)!;
  }

  const task = enqueuePresign(() => requestPresignedUrl(value, config!));
  inflightPresign.set(cacheKey, task);
  try {
    return await task;
  } finally {
    inflightPresign.delete(cacheKey);
  }
};

const transformValue = async (value: unknown, visited: WeakSet<object>): Promise<unknown> => {
  if (typeof value === 'string') {
    return presignUrl(value);
  }

  if (Array.isArray(value)) {
    const items = await Promise.all(value.map((item) => transformValue(item, visited)));
    return items;
  }

  if (value && typeof value === 'object') {
    if (visited.has(value)) {
      return value;
    }
    visited.add(value);
    const entries = Object.entries(value as Record<string, unknown>);
    const result: Record<string, unknown> = {};
    for (const [key, child] of entries) {
      result[key] = await transformValue(child, visited);
    }
    return result;
  }

  return value;
};

export const transformOssUrlsInObject = async <T>(value: T, requestUrl?: string): Promise<T> => {
  if (!value) return value;
  if (requestUrl && shouldSkipTransformForUrl(requestUrl)) {
    return value;
  }
  const visited = new WeakSet<object>();
  return (await transformValue(value, visited)) as T;
};

const extractUrlFromCssValue = (raw: string) => {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed || !isHttpUrl(trimmed)) {
    return null;
  }
  return trimmed;
};

const replaceCssUrls = async (styleText: string) => {
  if (!styleText.includes('url(')) {
    return styleText;
  }

  const matches = Array.from(styleText.matchAll(/url\(([^)]+)\)/g));
  if (matches.length === 0) {
    return styleText;
  }

  const replacements = new Map<string, string>();
  for (const match of matches) {
    const rawValue = match[1];
    const url = extractUrlFromCssValue(rawValue);
    if (!url) {
      continue;
    }
    if (!shouldPresignUrlSync(url)) {
      continue;
    }
    const signed = await presignUrl(url);
    replacements.set(rawValue, signed);
  }

  if (replacements.size === 0) {
    return styleText;
  }

  return styleText.replace(/url\(([^)]+)\)/g, (full, rawValue) => {
    const replacement = replacements.get(rawValue);
    if (!replacement) {
      return full;
    }
    return `url("${replacement}")`;
  });
};

const parseSrcset = (value: string) =>
  value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, ...rest] = part.split(/\s+/);
      return { url, descriptor: rest.join(' ') };
    });

const rebuildSrcset = (items: Array<{ url: string; descriptor: string }>) =>
  items
    .map((item) => (item.descriptor ? `${item.url} ${item.descriptor}` : item.url))
    .join(', ');

const processSrcsetValue = async (value: string) => {
  const entries = parseSrcset(value);
  if (entries.length === 0) {
    return value;
  }

  let changed = false;
  const signedEntries = await Promise.all(
    entries.map(async (entry) => {
      if (!shouldPresignUrlSync(entry.url)) {
        return entry;
      }
      const signed = await presignUrl(entry.url);
      if (signed !== entry.url) {
        changed = true;
      }
      return { ...entry, url: signed };
    }),
  );

  return changed ? rebuildSrcset(signedEntries) : value;
};

const updateAttribute = (element: Element, name: string, value: string) => {
  processingElements.add(element);
  try {
    element.setAttribute(PROCESSING_FLAG, 'true');
    element.setAttribute(name, value);
    element.removeAttribute(PROCESSING_FLAG);
  } finally {
    processingElements.delete(element);
  }
};

const processElement = async (element: Element) => {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === 'img' || tagName === 'video' || tagName === 'audio' || tagName === 'source' || tagName === 'model-viewer') {
    const src = element.getAttribute('src');
    if (src) {
      const signed = await presignUrl(src);
      if (signed && signed !== src) {
        updateAttribute(element, 'src', signed);
      }
    }
  }

  if ((tagName === 'img' || tagName === 'source') && element.hasAttribute('srcset')) {
    const srcset = element.getAttribute('srcset') || '';
    const signedSrcset = await processSrcsetValue(srcset);
    if (signedSrcset && signedSrcset !== srcset) {
      updateAttribute(element, 'srcset', signedSrcset);
    }
  }

  if (tagName === 'video' && element.hasAttribute('poster')) {
    const poster = element.getAttribute('poster') || '';
    const signedPoster = await presignUrl(poster);
    if (signedPoster && signedPoster !== poster) {
      updateAttribute(element, 'poster', signedPoster);
    }
  }

  if (element.hasAttribute('style')) {
    const styleText = element.getAttribute('style') || '';
    const signedStyle = await replaceCssUrls(styleText);
    if (signedStyle !== styleText) {
      updateAttribute(element, 'style', signedStyle);
    }
  }
};

const scanDocument = () => {
  if (typeof document === 'undefined') {
    return;
  }

  const selector = ['img[src]', 'img[srcset]', 'video[src]', 'video[poster]', 'audio[src]', 'source[src]', 'source[srcset]', 'model-viewer[src]', '[style]'].join(',');
  document.querySelectorAll(selector).forEach((element) => {
    void processElement(element);
  });
};

const patchSetAttribute = () => {
  if (typeof Element === 'undefined') {
    return;
  }

  const originalSetAttribute = Element.prototype.setAttribute;
  if ((Element.prototype as any).__ossPresignSetAttributePatched__) {
    return;
  }

  Element.prototype.setAttribute = function (name: string, value: string) {
    if (processingElements.has(this) || (this as Element).getAttribute(PROCESSING_FLAG)) {
      return originalSetAttribute.call(this, name, value);
    }

    const normalized = name.toLowerCase();
    if (normalized === 'style') {
      const result = originalSetAttribute.call(this, name, value);
      void processElement(this);
      return result;
    }

    if (normalized === 'src' || normalized === 'poster') {
      if (!shouldPresignUrlSync(value)) {
        return originalSetAttribute.call(this, name, value);
      }
      void (async () => {
        const signed = await presignUrl(value);
        updateAttribute(this, name, signed);
      })();
      return;
    }

    if (normalized === 'srcset') {
      if (!shouldPresignUrlSync(value)) {
        return originalSetAttribute.call(this, name, value);
      }
      void (async () => {
        const signed = await processSrcsetValue(value);
        updateAttribute(this, name, signed);
      })();
      return;
    }

    return originalSetAttribute.call(this, name, value);
  };

  (Element.prototype as any).__ossPresignSetAttributePatched__ = true;
};

const patchFetch = () => {
  const runtime = globalThis as typeof globalThis & Record<string, unknown>;
  if (typeof runtime.fetch !== 'function' || runtime[FETCH_PATCH_FLAG]) {
    return;
  }

  const originalFetch = runtime.fetch.bind(runtime);

  const isRequest = (value: unknown): value is Request =>
    typeof Request !== 'undefined' && value instanceof Request;

  const isUrl = (value: unknown): value is URL =>
    typeof URL !== 'undefined' && value instanceof URL;

  const buildInitFromRequest = (request: Request): RequestInit => {
    const cloned = request.clone();
    const method = cloned.method?.toUpperCase();
    const init: RequestInit = {
      method: cloned.method,
      headers: cloned.headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : (cloned as any).body ?? cloned.body,
      mode: cloned.mode,
      credentials: cloned.credentials,
      cache: cloned.cache,
      redirect: cloned.redirect,
      referrer: cloned.referrer,
      referrerPolicy: cloned.referrerPolicy,
      integrity: cloned.integrity,
      keepalive: (cloned as any).keepalive,
      signal: cloned.signal,
    };

    if ('duplex' in cloned) {
      (init as any).duplex = (cloned as any).duplex;
    }

    return init;
  };

  const patchedFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (isRequest(input)) {
      const signed = await presignUrl(input.url);
      if (signed !== input.url) {
        const mergedInit = init ? { ...buildInitFromRequest(input), ...init } : buildInitFromRequest(input);
        return originalFetch(signed, mergedInit);
      }
      return originalFetch(input, init);
    }

    const normalized = typeof input === 'string' ? input : isUrl(input) ? input.toString() : '';
    if (normalized) {
      const signed = await presignUrl(normalized);
      return originalFetch(signed, init);
    }

    return originalFetch(input, init);
  };
  runtime.fetch = patchedFetch;

  runtime[FETCH_PATCH_FLAG] = true;
};

const initDomObserver = () => {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        void processElement(mutation.target);
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            void processElement(node);
            node.querySelectorAll('[src], [srcset], [poster], [style]').forEach((child) => {
              void processElement(child);
            });
          }
        });
      }
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'poster', 'style'],
  });
};

export const initOssPresignInterceptors = (config?: PresignConfig | null) => {
  if (config) {
    setPresignConfig(config);
  }

  if (typeof window === 'undefined') {
    return;
  }

  if (!interceptorsInitialized) {
    interceptorsInitialized = true;
    patchFetch();
    patchSetAttribute();
    initDomObserver();
    scanDocument();
  } else if (config) {
    scanDocument();
  }
};

export const shouldSkipPresignTransform = shouldSkipTransformForUrl;
