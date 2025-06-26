import { I18nValue } from '@inf-monkeys/monkeys';

import { IAssetItem } from '@/apis/ugc/typings.ts';

export interface IDesignProject {
  id: string;
  displayName: string | Record<string, string>;
  description?: string | Record<string, string>;
  createdTimestamp: number;
  updatedTimestamp: number;
  boardIds?: string[];
  iconUrl?: string;
}

export interface IDesignBoardMetadata {
  id: string;
  displayName: string | Record<string, string>;
  createdTimestamp: number;
  updatedTimestamp: number;
  designProjectId: string;
  snapshot: any;
  pinned: boolean;
}

export type IDesignBoardItem = IAssetItem<Omit<IDesignBoardMetadata, 'snapshot'>>;

export interface IDesignAssociation {
  enabled: boolean;
  id: string;
  sortIndex?: number;
  displayName: I18nValue;
  iconUrl: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  type: 'team' | 'tenant';
  targetWorkflowId: string;
  targetInputId: string;
}
