import React, { useCallback } from 'react';

import { ColumnDef, flexRender, Row } from '@tanstack/react-table';
import { isFunction } from 'lodash';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';

interface IGetRenderNodeFnProps<E extends object> {
  row: Row<IAssetItem<E>>;
  columns: ColumnDef<IAssetItem<E>, any>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  cells: ReturnType<Row<IAssetItem<E>>['getAllCells']>;
}

export const useColumnRenderer = <E extends object>({
  row,
  columns,
  renderOptions,
  cells,
}: IGetRenderNodeFnProps<E>) => {
  return useCallback((columnId: string, defaultValue = '') => {
    const cell = cells.find((c) => c.column.id === columnId);

    const currentOption = renderOptions[columnId];
    if (currentOption) {
      if (isFunction(currentOption)) {
        return currentOption(row.original) as React.ReactNode;
      } else {
        return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : defaultValue;
      }
    } else if (columns.find((c) => c.id === columnId)) {
      return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : defaultValue;
    }

    return defaultValue;
  }, []);
};
