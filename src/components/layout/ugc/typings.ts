import React from 'react';

import { IAssetItem } from '@/apis/ugc/typings.ts';

export type IOperateAreaProps<E> = (
  item: IAssetItem<E>,
  trigger: React.ReactNode,
  tooltipTriggerContent?: string,
) => React.ReactNode;

export type IAssetCustomProps = {
  assetKey: string;
};

export type IRenderKey = 'title' | 'subtitle' | 'description' | 'tags' | 'time' | 'logo' | 'cover';

export type IDisplayMode = 'table' | 'gallery' | 'card' | null;
export type ISortConditionOrderBy = 'DESC' | 'ASC';
export type ISortConditionOrderColumn = 'createdTimestamp' | 'updatedTimestamp';
export type ISortCondition = {
  orderBy: ISortConditionOrderBy;
  orderColumn: ISortConditionOrderColumn;
};
export type IDividePageType = 'pagination' | 'scroll' | null;

export type IUgcRenderOptions<E> = {
  [type in IRenderKey]?: keyof E | ((item: E) => React.ReactNode);
};

export type IAssetCustomStorage<T> = {
  [teamId: string]: {
    [assetKey: string]: T;
  };
};

export type IDisplayModeStorage = IAssetCustomStorage<IDisplayMode>;
export type IDefaultPageSizeStorage = IAssetCustomStorage<number>;
export type ISortConditionStorage = IAssetCustomStorage<ISortCondition>;
export type IDividePageTypeStorage = IAssetCustomStorage<IDividePageType>;
