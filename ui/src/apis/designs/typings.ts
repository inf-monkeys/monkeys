import { IAssetItem } from '@/apis/ugc/typings.ts';

export interface IDesignProject {
  displayName: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  boardIds?: string[];
}

export interface IDesignBoardMetadata {
  displayName: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  designProjectId: string;
  snapshot: any;
  pinned: boolean;
}

export type IDesignBoardItem = IAssetItem<Omit<IDesignBoardMetadata, 'snapshot'>>;
