import React from 'react';

import { AssetType } from '@inf-monkeys/vines';
import { ColumnDef, Row } from '@tanstack/react-table';

import { IAssetItem } from '@/apis/ugc/typings.ts';

export interface IUgcViewItemProps<E extends object> {
  row: Row<IAssetItem<E>>;
  columns: ColumnDef<IAssetItem<E>, any>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: IOperateAreaProps<E>;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  index: number;
}

export type IOperateAreaProps<E> = (
  item: IAssetItem<E>,
  trigger: React.ReactNode,
  tooltipTriggerContent?: string,
) => React.ReactNode;

export type IUgcCustomProps = {
  assetType: AssetType;
  assetKey: string;
  isMarket?: boolean;
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
  [type in IRenderKey]?: ColumnDef<E>['id'] | ((item: E) => React.ReactNode);
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
