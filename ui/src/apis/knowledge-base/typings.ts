import { I18nValue } from '@inf-monkeys/monkeys';

export interface IKnowledgeBaseMetadataField {
  displayName: string | I18nValue;
  name: string;
  description: string | I18nValue;
  builtIn: boolean;
  required: boolean;
}

export interface IKnowledgeBase {
  createTime: number;
  dimension: number;
  name: string;
  displayName: string | I18nValue;
  embeddingModel: string;
  description?: string | I18nValue;
  iconUrl?: string;
  engine: string;
  teamId: string;
  creatorUserId: string;
  metadataFields: IKnowledgeBaseMetadataField[];
  entityCount: number;
  fileCount: number;
  createdTimestamp: number;
  uuid: string;
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

export interface ICreateVectorDB {
  displayName: string | I18nValue;
  iconUrl: string;
  description?: string | I18nValue;
  embeddingModel: string;
}
