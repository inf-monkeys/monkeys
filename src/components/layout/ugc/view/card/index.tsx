import React, { useMemo } from 'react';

import { Row } from '@tanstack/react-table';
import _ from 'lodash';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IUgcViewCardProps<E extends object> {
  row: Row<IAssetItem<E>>;
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: (item: IAssetItem<E>) => React.ReactNode;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  index: number;
}

export const UgcViewCard = <E extends object>({
  row,
  index,
  renderOptions,
  operateArea,
  onItemClick,
}: IUgcViewCardProps<E>) => {
  const getRenderNode = (key: string, defaultValue?: React.ReactNode) =>
    renderOptions[key]
      ? _.isFunction(renderOptions[key])
        ? (renderOptions[key](row.original) as React.ReactNode)
        : row.renderValue<React.ReactNode>(renderOptions[key])
      : defaultValue ?? '';

  const logo = useMemo(() => getRenderNode('logo'), [index, row]);
  const title = useMemo(() => getRenderNode('title'), [index, row]);
  const subtitle = useMemo(() => getRenderNode('subtitle'), [index, row]);
  const description = useMemo(() => getRenderNode('description', '暂无描述'), [index, row]);

  return (
    <Card
      className={cn('h-40', {
        'cursor-pointer transition-colors hover:bg-[--bg-hover-color]': !!onItemClick,
        'cursor-default': !onItemClick,
      })}
      onClick={
        onItemClick
          ? (e) => {
              onItemClick(row.original, e);
            }
          : undefined
      }
    >
      <CardHeader className="p-4">
        <CardTitle className="flex justify-between gap-3 font-medium">
          <div>{logo}</div>
          <div className="flex flex-col">
            <Tooltip content={title}>
              <TooltipTrigger asChild>
                <span className="line-clamp-1 text-base font-bold">{title}</span>
              </TooltipTrigger>
            </Tooltip>
            <span className="text-xs">{subtitle}</span>
          </div>
          <div className="flex-1" />
          <div>{operateArea?.(row.original)}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-1 text-xs text-opacity-70">{description}</div>
      </CardContent>
    </Card>
  );
};
