export enum ObservabilityPlatform {
  LANGFUSE = 'langfuse',
}

export type LangfusePlatformConfig = {
  secretKey: string;
  publicKey: string;
  baseUrl?: string;
};

export type LangfuseObservabilityConfig = {
  platform: ObservabilityPlatform.LANGFUSE;
  platformConfig: LangfusePlatformConfig;
};

export type ObservabilityPlatformConfig = LangfusePlatformConfig;
export type ObservabilityConfig = LangfuseObservabilityConfig;
