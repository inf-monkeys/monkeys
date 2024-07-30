import { SWRResponse } from 'swr';

import { AssetType, I18nValue } from '@inf-monkeys/monkeys';

import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IBaseEntity, IPaginationListData } from '@/apis/typings.ts';
import { ISortConditionOrderBy, ISortConditionOrderColumn } from '@/components/layout/ugc/typings.ts';

export interface IAssetTag {
  id: string;
  name: string;
  _pinyin: string;
  icon: string;
}

export type IAssetItem<T = object> = T & {
  id: string;
  name: string;
  description?: string | I18nValue;
  iconUrl?: string;
  teamId?: string;
  creatorUserId?: string;
  team?: Partial<IVinesTeam>;
  user?: Partial<IVinesUser>;
  assetTags?: IAssetTag[];
  assetType?: AssetType;
  isDeleted?: boolean;
  isPreset?: boolean;
  isPublished?: boolean;
};

export interface IAssetPublicCategory extends IBaseEntity {
  name: string;
  type: AssetType;
}

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
  rules: Partial<IListUgcDto['filter']>;
  isUserPrivate?: boolean;
}

export interface IListUgcDto {
  page: number;
  limit: number;
  search?: string;
  orderColumn?: ISortConditionOrderColumn;
  orderBy?: ISortConditionOrderBy;
  filter?: IListUgcFilter;
}

export type IManuallyFetcher<T> = {
  isLoading: boolean;
  mutate: () => Promise<void>;
  data: IPaginationListData<IAssetItem<T>> | undefined;
};

export type IListUgcItemsFnType<T> = (
  dto: IListUgcDto,
) => SWRResponse<IPaginationListData<IAssetItem<T>> | undefined, any> | IManuallyFetcher<T>;
export type IPreloadUgcItemsFnType<T> = (dto: IListUgcDto) => Promise<any>;
