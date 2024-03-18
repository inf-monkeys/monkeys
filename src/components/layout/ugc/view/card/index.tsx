import React, { useMemo } from 'react';

import { Row } from '@tanstack/react-table';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { cn } from '@/utils';

interface IUgcViewCardProps<E extends object> {
  row: Row<IAssetItem<E>>;
  renderOptions: IUgcRenderOptions<E>;
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
  const logo = useMemo(
    () => (renderOptions.logo ? row.renderValue<React.ReactNode>(renderOptions.logo.toString()) : ''),
    [index, row],
  );
  const title = useMemo(
    () => (renderOptions.title ? row.renderValue<string>(renderOptions.title.toString()) : ''),
    [index, row],
  );
  const subtitle = useMemo(
    () => (renderOptions.subtitle ? row.renderValue<React.ReactNode>(renderOptions.subtitle.toString()) : ''),
    [index, row],
  );
  const description = useMemo(
    () => (renderOptions.description ? row.renderValue<string>(renderOptions.description.toString()) : '暂无描述'),
    [index, row],
  );

  return (
    <Card
      className={cn('h-44', {
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
        <CardTitle className="flex items-center justify-between font-medium">
          <div className="flex gap-3 ">
            {logo}
            <div className="flex flex-col">
              <span className="text-base font-bold">{title}</span>
              <span className="text-xs">{subtitle}</span>
            </div>
          </div>
          <div>{operateArea?.(row.original)}</div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-col gap-1 text-xs">{description}</div>
      </CardContent>
    </Card>
  );
};
