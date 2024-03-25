import { TeamEntity } from '@/database/entities/identity/team';
import { UserEntity } from '@/database/entities/identity/user';

export type AssetType = 'llm-model' | 'sd-model' | 'workflow' | 'workflow-view' | 'workflow-template' | 'media-file' | 'table-collection' | 'text-collection' | 'canvas';

export const ALLOW_ASSET_TYPES: AssetType[] = ['canvas', 'llm-model', 'media-file', 'sd-model', 'table-collection', 'text-collection', 'workflow', 'workflow-view', 'workflow-template'];

export type AssetWithIdentity<T extends object> = T & {
  team: Partial<TeamEntity>;
  user: Partial<UserEntity>;
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
