export type OriginResponse<T> = {
  code?: number;
  status?: number;
  data?: T;
  message?: string;
};

export type SystemConfig = {
  theme?: {
    id?: string;
    name?: string;
    title?: string;
    logo?: {
      light?: string;
      dark?: string;
    };
    favicon?: {
      light?: string;
      dark?: string;
    };
  };
  storage?: {
    presign?: {
      expiresInSeconds: number;
      buckets: Array<{
        id: string;
        provider: string;
        preferredUrlPatternId: string;
        urlPatterns: Array<{
          id: string;
          type: 'bucket-hostname' | 'provider-hostname';
          hostname: string;
          preferred?: boolean;
          bucketSegment?: string;
        }>;
      }>;
    };
  };
};

export async function getSystemConfig(): Promise<SystemConfig | undefined> {
  const response = await fetch('/api/configs', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  });

  if (!response.ok) return undefined;

  const json = (await response.json().catch(() => undefined)) as unknown;
  if (!json || typeof json !== 'object') return undefined;

  const maybeOrigin = json as OriginResponse<SystemConfig>;
  const code = maybeOrigin.code ?? maybeOrigin.status;
  if (typeof code === 'number') {
    if (code !== 200) return undefined;
    return maybeOrigin.data;
  }

  return json as SystemConfig;
}
