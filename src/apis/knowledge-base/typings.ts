export interface IKnowledgeBaseMetadataField {
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
  metadataFields: IKnowledgeBaseMetadataField[];
  entityCount: number;
  fileCount: number;
  createdTimestamp: number;
}

export type IKnowledgeBaseFrontEnd = IKnowledgeBase & { paragraph_number: number; appNumber: number };
