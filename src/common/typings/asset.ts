import { AssetsTagEntity } from '@/database/entities/assets/asset-tag-definitions';
import { TeamEntity } from '@/database/entities/identity/team';
import { UserEntity } from '@/database/entities/identity/user';

export type AssetType = 'llm-model' | 'sd-model' | 'workflow' | 'workflow-view' | 'workflow-template' | 'media-file' | 'canvas' | 'knowledge-base' | 'tools' | 'block';

export const ALLOW_ASSET_TYPES: AssetType[] = ['canvas', 'llm-model', 'media-file', 'sd-model', 'workflow', 'workflow-view', 'workflow-template', 'knowledge-base'];

export type AssetWithAdditionalInfo<T extends object> = T & {
  team?: Partial<TeamEntity>;
  user?: Partial<UserEntity>;
  assetTags?: Partial<AssetsTagEntity>[];
};

export type ConvertListDtoToDbQueryOptions = {
  mixinOrQuery?: any[];
  mixInQuery?: Record<string, any>;
  searchColumns?: string[];
};

export enum TargetType {
  USER = 'USER',
  TEAM = 'TEAM',
}

export interface AuthorizedTarget {
  targetType: TargetType;
  targetId: string;
}
