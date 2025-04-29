export type LangfusePlatform = 'langfuse';
export type LangfusePlatformConfig = {
  secretKey: string;
  publicKey: string;
  baseUrl?: string;
};

export type LangfuseObservabilityConfig = {
  platform: LangfusePlatform;
  platformConfig: LangfusePlatformConfig;
};

export type ObservabilityPlatform = LangfusePlatform;
export type ObservabilityPlatformConfig = LangfusePlatformConfig;
export type ObservabilityConfig = LangfuseObservabilityConfig;
