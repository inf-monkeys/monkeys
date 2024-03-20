import { SWRResponse } from 'swr';

import { AssetType } from '@inf-monkeys/vines';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IBaseEntity, IPaginationListData } from '@/apis/typings.ts';

export interface IAssetTag {
  _id: string;
  name: string;
}

export type IAssetItem<T = object> = T & {
  _id: string;
  name: string;
  description: string;
  iconUrl: string;
  teamId?: string;
  creatorUserId?: string;
  team?: Partial<IVinesTeam>;
  user?: Partial<IVinesUser>;
  assetTags?: string[];
  assetType?: AssetType;
  isPresetAsset?: boolean;
  isPublicAsset?: boolean;
};

export interface IAssetPublicCategory extends IBaseEntity {
  name: string;
  type: AssetType;
}

type IOrderColumn = 'createdTimestamp' | 'updatedTimestamp';
type IOrderBy = 'DESC' | 'ASC';

type IListUgcFilter = {
  userIds?: string[];
  createdTimestamp?: (number | null)[];
  updatedTimestamp?: (number | null)[];
  tagIds?: string[];
  categoryIds?: string[];
  ids?: string[];
  [key: string]: any;
};

export interface IUgcFilterRules extends IBaseEntity {
  teamId: string;
  creatorUserId: string;
  name: string;
  rules: Record<string, unknown>;
  isUserPrivate?: boolean;
}

export interface IListUgcDto {
  page: number;
  limit: number;
  search?: string;
  orderColumn?: IOrderColumn;
  orderBy?: IOrderBy;
  filter: IListUgcFilter;
}

export type IListUgcItemsFnType<T> = (
  dto: IListUgcDto,
) => SWRResponse<IPaginationListData<IAssetItem<T>> | undefined, any>;
export type IPreloadUgcItemsFnType<T> = (dto: IListUgcDto) => Promise<any>;
