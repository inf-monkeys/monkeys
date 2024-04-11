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
