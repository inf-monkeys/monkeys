import React from 'react';

import { ColumnDef, flexRender, Row } from '@tanstack/react-table';
import _ from 'lodash';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';

interface IGetRenderNodeFnProps<E extends object> {
  row: Row<IAssetItem<E>>;
  columns: ColumnDef<IAssetItem<E>, any>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
}

export const getRenderNodeFn =
  <E extends object>({ row, columns, renderOptions }: IGetRenderNodeFnProps<E>) =>
  (key: string, defaultValue?: React.ReactNode, columnKey = true) =>
    renderOptions[key]
      ? _.isFunction(renderOptions[key])
        ? (renderOptions[key](row.original) as React.ReactNode)
        : (() => {
            const cell = row.getAllCells().find((c) => c.column.id === (columnKey ? key : renderOptions[key]));
            return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : defaultValue ?? '';
          })()
      : columns.find((c) => c.id === key)
        ? (() => {
            const cell = row.getAllCells().find((c) => c.column.id === (columnKey ? key : renderOptions[key]));
            return cell ? flexRender(cell.column.columnDef.cell, cell.getContext()) : defaultValue ?? '';
          })()
        : defaultValue ?? '';
