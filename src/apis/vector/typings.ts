import { IImportFromOSS } from '@/schema/text-dataset/import-oss.ts';

export interface IVectorMetadataField {
  displayName: string;
  name: string;
  description: string;
  builtIn: boolean;
  required: boolean;
}

export interface IKnowledgeBase {
  id: string;
  createTime: number;
  dimension: number;
  name: string;
  displayName: string;
  embeddingModel: string;
  description?: string;
  iconUrl?: string;
  engine: string;
  teamId: string;
  creatorUserId: string;
  metadataFields: IVectorMetadataField[];
  entityCount: number;
  fileCount: number;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export type IKnowledgeBaseFrontEnd = IKnowledgeBase & { paragraph_number: number; appNumber: number };

export interface IVectorSupportedEmbeddingModel {
  name: string;
  displayName: string;
  dimension: number;
  enabled: boolean;
  link: string;
  model_path: string;
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
  metadataFilter?: { [x: string]: unknown };
}

export interface IVectorRecord {
  _id: string;
  _score: string;
  _index: string;
  sort: number[];
  _source: {
    page_content: string;
    metadata?: { [x: string]: unknown };
    embeddings: number[];
  };
}

export interface IFullTextSearchResult {
  hits: IVectorRecord[];
}

interface ISplit {
  splitType: 'json' | 'auto-segment' | 'custom-segment';
  params: any;
}

interface ISplitJSON extends ISplit {
  splitType: 'json';
  params: {
    jqSchema: string;
  };
}

interface ISplitAutoSegment extends ISplit {
  splitType: 'auto-segment';
}

interface ISplitCustomSegment extends ISplit {
  splitType: 'custom-segment';
  params: {
    preProcessRules: string[];
    segmentParams: {
      segmentSymbol?: string;
      segmentMaxLength?: number;
      segmentChunkOverlap?: number;
    };
  };
}

export type ISplitType = ISplitJSON | ISplitAutoSegment | ISplitCustomSegment;

export interface IUploadDocument {
  collectionName: string;
  fileURL?: string;
  split: ISplitType;
  ossConfig?: IImportFromOSS;
}

export interface IVectorTask {
  createdTimestamp: string;
  taskId: string;
  events: {
    progress: number;
    message: string;
    timestamp: number;
    status: string;
  }[];
}
