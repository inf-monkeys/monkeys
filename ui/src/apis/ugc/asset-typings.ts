import { AssetType, I18nValue, MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { SdModelType, SdWorkProcessStatus, XYZTestResult } from '@/apis/sd/typings.ts';

export interface IBaseAsset {
  originalSite: string;
  originalId: string;
  assetType: AssetType;

  [x: string]: any;
}

export interface IWorkflowExportJson extends IBaseAsset {
  name: string;
  iconUrl: string;
  description: string;
  version?: number;
}

export interface ITeamCustomTheme {
  primaryColor?: string;
  backgroundColor?: string;
  secondaryBackgroundColor?: string;
  enableTeamLogo?: boolean;
}

export interface ITeamInfoJson {
  name: string;
  description: string;
  iconUrl: string;
  workflowTaskNamePrefix: string;
  customTheme: ITeamCustomTheme;
}

export interface ISqlTableJson {
  name: string;
}

export interface ITableCollectionsJson extends IBaseAsset {
  name: string;
  description: string;
  type: string;
  tables: ISqlTableJson[];
  sqlFile: string;
}

export type IResourceType = 'image' | 'text';

export interface IRichMediaJson {
  type: IResourceType;
  name: string;
  url: string;
  tags: string[];
  size: number;
  source: MediaSource;
  params?: any;
}

export interface IVectorCollectionFileSplitConfig {
  chunkSize: number;
  chunkOverlap: number;
  separator: string;
  preProcessRules: any;
  jqSchema: any;
}

export interface IVectorCollectionFileJson {
  url: string;
  splitConfig: IVectorCollectionFileSplitConfig;
}

export type IVectorCollectionField = {
  name: string;
  displayName: string | I18nValue;
  description: string | I18nValue;
  builtIn: boolean;
  required: boolean;
};

export interface ITextCollectionJson extends IBaseAsset {
  displayName: string | I18nValue;
  description: string | I18nValue;
  iconUrl: string;
  embeddingModel: string;
  dimension: number;
  metadataFields: IVectorCollectionField[];
  indexType: string;
  indexParam: any;
  files: IVectorCollectionFileJson[];
}

export interface ILlmModelJson extends IBaseAsset {
  name: string;
  iconUrl: string;
  description: string;
  baseModel: string;
  loraModel?: string;
  llmType: 'chatglm' | 'baichuan' | 'llama' | string;
  quantization?: 'gptq';
  promptTemplate: string;
  gpuMemoryLimit: number;
  contextMaxLength: number;
}

export interface ISdModelJson extends IBaseAsset {
  name: string;
  iconUrl: string;
  description: string;
  status: SdWorkProcessStatus;
  progress: number;
  modelId: string;
  keywords: string;
  images: string[];
  params: Record<string, any>;
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
}

export interface IWorkflowRelatedAssetResult {
  subWorkflows?: IWorkflowExportJson[];
  sdModels?: ISdModelJson[];
  llmModels?: ILlmModelJson[];
  textCollections?: ITextCollectionJson[];
  tableCollections?: ITableCollectionsJson[];
  invalidAssetMessages?: string[];
}

export interface IApplicationStoreItem {
  id: string;
  displayName: string | I18nValue;
  description: string | I18nValue;
  iconUrl: string;
  teamId: string;
  workflowId: string;
  creatorUserId: string;
  categoryIds: string[];
  fetchCount: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: false;
  workflowVersion: number;
  assetsPolicy: { [x: string]: any };
}

export type IApplicationStoreItemDetail = IApplicationStoreItem & {
  workflow: MonkeyWorkflow;
  user: Partial<IVinesUser>;
};
