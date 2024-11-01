import { WorkflowMetadataEntity, WorkflowOutputValue, WorkflowRateLimiter } from '@/database/entities/workflow/workflow-metadata';
import { PageInstanceType, PagePermission } from '@/database/entities/workflow/workflow-page';
import { WebhookTriggerConfig, WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Workflow } from '@inf-monkeys/conductor-javascript';
import { AssetType, I18nValue, MonkeyTaskDefTypes, ToolProperty, WorkflowValidationIssue } from '@inf-monkeys/monkeys';

export interface BaseAsset {
  originalSite: string;
  originalId: string;
  assetType: AssetType;
}

export interface TeamInfoJson {
  name: string;
  description: string;
  iconUrl: string;
  workflowTaskNamePrefix: string;
  // TODO
  customTheme: any;
}

export interface SqlTableJson {
  name: string;
}

export interface TableCollectionsJson extends BaseAsset {
  name: string;
  description: string;
  type: string;
  tables: SqlTableJson[];
  sqlFile: string;
}

export interface RichMediaJson {
  // TODO
  type: string;
  name: string;
  url: string;
  tags: string[];
  size: number;
  source: MediaSource;
  params?: any;
}

export interface VectorCollectionFileSplitConfig {
  chunkSize: number;
  chunkOverlap: number;
  separator: string;
  preProcessRules: any;
  jqSchema: any;
}

export interface VectorCollectionFileJson {
  url: string;
  splitConfig: VectorCollectionFileSplitConfig;
}

export interface TextCollectionJson extends BaseAsset {
  displayName: string;
  description: string;
  iconUrl: string;
  embeddingModel: string;
  dimension: number;
  // TOSO
  metadataFields: any;
  indexType: string;
  indexParam: any;
  files: VectorCollectionFileJson[];
}

export interface LlmModelJson extends BaseAsset {
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

export interface SdModelJson extends BaseAsset {
  name: string;
  iconUrl: string;
  description: string;
  // TODO
  status: string;
  progress: number;
  modelId: string;
  keywords: string;
  images: string[];
  params: Record<string, any>;
  // TODO
  type?: string;
  baseModel: 'SD 1' | 'SD 2' | 'SDXL';
  modelFormat?: 'ckpt' | 'safetensors';
  disableTextToImage?: boolean;
  disableImageToImage?: boolean;
  disableFineTune?: boolean;
  outputModels?: string[];
  outputSamples?: string[];
  outputLogs?: [];
  // TODO
  outputXYZTest?: any;
  version?: string;
  civitaiUrl?: string;
}

export interface WorkflowTriggerJson {
  type: WorkflowTriggerType;
  enabled: boolean;
  cron?: string;
  webhookConfig?: WebhookTriggerConfig;
}

export interface WorkflowPageJson {
  displayName: string;
  type: PageInstanceType;
  pinned: boolean;
  sortIndex: number;
  isBuiltIn: boolean;
  permissions: PagePermission[];
}

export interface WorkflowExportJson extends BaseAsset {
  displayName: string | I18nValue;
  iconUrl: string;
  description: string | I18nValue;
  version?: number;
  tasks: MonkeyTaskDefTypes[];
  triggers: WorkflowTriggerJson[];
  variables: ToolProperty[];
  output: WorkflowOutputValue[];
  validationIssues?: WorkflowValidationIssue[];
}

export interface WorkflowWithAssetsJson {
  workflows: WorkflowExportJson[];
  pages: WorkflowPageJson[];
  sdModels?: SdModelJson[];
  llmModels?: LlmModelJson[];
  textCollections?: TextCollectionJson[];
  tableCollections?: TableCollectionsJson[];
  invalidAssetMessages?: string[];
}

export interface WorkflowWithPagesJson {
  workflows: WorkflowExportJson[];
  pages: WorkflowPageJson[];
}

export interface TemplateJson extends WorkflowExportJson {
  workflowId: string;
  templateId: string;
  categories: string[];
}

export interface AssetsPolicyValue {
  assetType: AssetType;
  value: string;
}

export interface CreateWorkflowOptions {
  useExistId?: string;
  forkFromId?: string;
  useNewId?: boolean;
  // key 是资产 id
  assetsPolicy?: { [x: string]: string | AssetsPolicyValue };
  isTheSameTeam?: boolean;
  replaceSdModelMap?: { [x: string]: any };
  replaceLlmModelMap?: { [x: string]: any };
  replaceVectorDatabaseMap?: { [x: string]: any };
  replaceSqlDatabaseMap?: { [x: string]: any };
}

export interface CreateWorkflowData {
  displayName: string | I18nValue;
  iconUrl?: string;
  description?: string | I18nValue;
  version?: number;
  tasks: MonkeyTaskDefTypes[];
  triggers?: WorkflowTriggerJson[];
  variables?: ToolProperty[];
  output?: WorkflowOutputValue[];
  exposeOpenaiCompatibleInterface?: boolean;
  rateLimiter?: WorkflowRateLimiter;
}

export interface GenerateSubWorkflowsToSaveAtImportResult {
  workflowsToSave: Partial<WorkflowMetadataEntity>[];
  originalWorkflowIdToNewWorkflowIdMap: { [x: string]: any };
}

export interface ExportWorkflowOptions {
  exportAssets?: boolean;
}

export interface WorkflowRelatedAssetResult {
  subWorkflows?: WorkflowExportJson[];
  sdModels?: SdModelJson[];
  llmModels?: LlmModelJson[];
  textCollections?: TextCollectionJson[];
  tableCollections?: TableCollectionsJson[];
  invalidAssetMessages?: string[];
}

export interface StartWorkflowRequest {
  teamId: string;
  userId: string;
  workflowId: string;
  apiKey?: string;
  version?: number;
  inputData: { [x: string]: any };
  triggerType: WorkflowTriggerType;
  chatSessionId?: string;
}

export interface DebugWorkflowRequest {
  teamId: string;
  userId: string;
  workflowId: string;
  inputData: { [x: string]: any };
  output?: WorkflowOutputValue[];
  tasks: MonkeyTaskDefTypes[];
}

export type DebugWorkflowDto = Omit<DebugWorkflowRequest, 'teamId' | 'userId' | 'workflowId'>;

export type WorkflowExecutionOutput = Pick<Workflow, 'status' | 'startTime' | 'createTime' | 'updateTime' | 'endTime' | 'workflowId' | 'output' | 'input'> & {
  output: any[];
  rawOutput: Record<string, any>;
  workflowId: string;
  taskId: string;
  userId: string;
  teamId: string;
};
