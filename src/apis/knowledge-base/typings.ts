export interface IVectorMetadataField {
  displayName: string;
  name: string;
  description: string;
  builtIn: boolean;
  required: boolean;
}

export interface IVectorCollection {
  _id: string;
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

export type IVectorFrontEnd = IVectorCollection & { paragraph_number: number; appNumber: number };

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
