import React from 'react';

export type ISortCondition = {
  orderBy: 'DESC' | 'ASC';
  orderColumn: 'createdTimestamp' | 'updatedTimestamp';
  dividePage: 'pagination' | 'scroll' | null;
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
