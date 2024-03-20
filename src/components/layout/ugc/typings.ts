import React from 'react';

export type IAssetCustomProps = {
  assetKey: string;
};

export type IRenderType =
  | 'title'
  | 'subtitle'
  | 'description'
  | 'user-profile'
  | 'team-profile'
  | 'tags'
  | 'time'
  | 'logo'
  | 'color';

export type IDisplayMode = 'table' | 'gallery' | 'card' | null;
export type ISortConditionOrderBy = 'DESC' | 'ASC';
export type ISortConditionOrderColumn = 'createdTimestamp' | 'updatedTimestamp';
export type ISortCondition = {
  orderBy: ISortConditionOrderBy;
  orderColumn: ISortConditionOrderColumn;
};
export type IDividePageType = 'pagination' | 'scroll' | null;

export type IUgcRenderOptions<E> = {
  [type in IRenderType]?: keyof E | ((item: E) => React.ReactNode);
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
