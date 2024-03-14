import { IVinesUser } from '@/apis/authz/user/typings.ts';

export interface ISDModelsParams {
  page: number;
  limit: number;
  status?: 'waiting' | 'running' | 'finished' | 'failed';
}

export enum SdWorkProcessStatus {
  PENDING = 0,
  CONVERTING = 1,
  FINISHED = 2,
  FAIL = 3,
}

export type SdModelType = 'Checkpoint' | 'Lora' | 'Embedding' | 'VAE';

export interface XYZTestResult {
  error?: string;
  x: { name: string; value: string[] };
  y: { name: string; value: string[] };
  items: { x: string; y: string; href: string; prompt: string }[][];
}

export interface ISDModel {
  teamId: string;
  creatorUserId: string;
  status: SdWorkProcessStatus;
  progress: number;
  md5: string;
  modelId: string;
  name: string;
  description?: string;
  iconUrl: string;
  keywords: string;
  images: string[];
  params: Record<string, unknown>;
  type?: SdModelType;
  baseModel: 'SD 1' | 'SD 2' | 'SDXL';
  modelFormat?: 'ckpt' | 'safetensors';
  disableTextToImage?: boolean;
  disableImageToImage?: boolean;
  disableFineTune?: boolean;
  outputModels?: string[];
  outputSamples?: string[];
  outputLogs?: [];
  outputXYZTest?: XYZTestResult;
  version?: string;
  civitaiUrl?: string;
  tags: string[];
  isUserModel?: boolean;
  creator?: Partial<IVinesUser>;
  isPresetAsset?: boolean;
}
