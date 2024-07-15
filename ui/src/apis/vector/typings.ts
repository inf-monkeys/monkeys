import { I18nValue } from '@inf-monkeys/monkeys';

export interface IVectorMetadataField {
  displayName: string;
  name: string;
}

export interface IKnowledgeBase {
  id: string;
  createTime: number;
  dimension: number;
  uuid: string;
  displayName: string | I18nValue;
  embeddingModel: string;
  description?: string | I18nValue;
  iconUrl?: string;
  engine: string;
  teamId: string;
  creatorUserId: string;
  entityCount: number;
  fileCount: number;
  createdTimestamp: number;
  updatedTimestamp: number;
  retrievalSettings?: KnowledgeBaseRetrievalSettings;
}

export type IKnowledgeBaseFrontEnd = IKnowledgeBase & { paragraph_number: number; appNumber: number };

export interface IVectorSupportedEmbeddingModel {
  name: string;
  displayName: string | I18nValue;
  dimension: number;
  enabled: boolean;
  link: string;
  model_path: string;
}

export interface IKnowledgeBaseDocument {
  id: string;
  createdAt: string;
  updatedAt: string;
  knowledgeBaseId: string;
  failedMessage: string;
  indexStatus: string;
  filename: string;
  fileUrl: string;
}

export enum KnowledgeBaseRetrievalMode {
  VectorSearch = 'vector-search',
  FullTextSearch = 'fulltext-search',
}

export interface KnowledgeBaseRetrievalSettings {
  mode: KnowledgeBaseRetrievalMode;
  topK: number;
  scoreThreshHold?: number;
  // Sometime, you may want to filter the document by metadata before retrieval.
  // For example: See you have serveral documents about different company's annual report, we user ask a question about a specific company,
  // you may want to filter the documents by company name before retrieval.
  enabledMetadataFilter?: boolean;
  metadataFilterKey?: string;
}

export interface ICreateVectorDB {
  displayName: string;
  iconUrl: string;
  description?: string;
  embeddingModel: string;
}

export interface ICreateVectorData {
  collectionName: string;
  text: string;
  delimiter?: string;
  metadata?: { [x: string]: unknown };
}

export interface IFullTextSearchParams {
  query?: string;
  from?: number;
  size?: number;
  metadata_filter?: { [x: string]: unknown };
}

export interface IVectorRecord {
  page_content: string;
  metadata?: { [x: string]: unknown };
  pk: string;
}

export interface IFullTextSearchResult {
  hits: IVectorRecord[];
}

interface ISplit {
  splitterType?: 'json' | 'auto-segment' | 'custom-segment';
  preProcessRules?: string[];
  splitterConfig?: any;
}

interface ISplitJSON extends ISplit {
  splitterType: 'json';
  splitterConfig?: {
    jqSchema: string;
  };
}

interface IAutoSplitterConfig extends ISplit {
  splitterConfig: 'auto-segment';
}

interface ICustomSplitterConfig extends ISplit {
  splitterType: 'custom-segment';
  preProcessRules: string[];
  splitterConfig: {
    separator?: string;
    chunk_size?: number;
    chunk_overlap?: number;
  };
}

export type ISplitType = ISplitJSON | IAutoSplitterConfig | ICustomSplitterConfig;

export interface IUploadDocument extends ISplit {
  knowledgeBaseId: string;
  fileURL?: string;
  fileName?: string;
  ossType?: string;
  ossConfig?: { [x: string]: any };
}

export enum KnowledgebaseTaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IKnowledgebaseTask {
  createdAt: string;
  updatedAt: string;
  id: string;
  knowledgeBaseId: string;
  latestMessage: string;
  progress: number;
  status: KnowledgebaseTaskStatus;
}
