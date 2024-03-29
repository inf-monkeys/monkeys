import React from 'react';

import { Row } from '@tanstack/react-table';
import _ from 'lodash';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';

interface IGetRenderNodeFnProps<E extends object> {
  row: Row<IAssetItem<E>>;
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
}

export const getRenderNodeFn =
  <E extends object>({ row, renderOptions }: IGetRenderNodeFnProps<E>) =>
  (key: string, defaultValue?: React.ReactNode, rowKey = false) =>
    renderOptions[key]
      ? _.isFunction(renderOptions[key])
        ? (renderOptions[key](row.original) as React.ReactNode)
        : row.renderValue<React.ReactNode>(rowKey ? key : renderOptions[key])
      : defaultValue ?? '';
