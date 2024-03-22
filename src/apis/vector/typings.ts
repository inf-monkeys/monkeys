export interface IVectorMetadataField {
  displayName: string;
  name: string;
  description: string;
  builtIn: boolean;
  required: boolean;
}

export interface IVectorCollection {
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
}

export type IVectorFrontEnd = IVectorCollection & { paragraph_number: number; appNumber: number };
