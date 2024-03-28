import React, { useMemo } from 'react';

import { flexRender, Row } from '@tanstack/react-table';
import { CircleEllipsis, Info } from 'lucide-react';

import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IOperateAreaProps, IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';
import { getRenderNodeFn } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IUgcViewGalleryItemProps<E extends object> {
  row: Row<IAssetItem<E>>;
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: IOperateAreaProps<E>;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  index: number;
}

export const UgcViewGalleryItem = <E extends object>({
  row,
  index,
  renderOptions,
  operateArea,
  onItemClick,
}: IUgcViewGalleryItemProps<E>) => {
  const getRenderNode = getRenderNodeFn({
    row,
    renderOptions,
  });

  const cover = useMemo(() => getRenderNode('cover'), [index, row]);
  const title = useMemo(() => getRenderNode('title'), [index, row]);
  const subtitle = useMemo(() => getRenderNode('subtitle'), [index, row]);
  const description = useMemo(() => getRenderNode('description') || '暂无描述', [index, row]);

  return (
    <div
      className={cn('group flex flex-col items-center gap-2', {
        'cursor-pointer transition-all': !!onItemClick,
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
      <div className="relative flex items-end justify-end">
        {cover}
        <div className="absolute flex translate-x-[-0.5rem] translate-y-[-0.5rem] cursor-pointer gap-1 opacity-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)] transition-all group-hover:opacity-100">
          <Popover>
            <Tooltip content="信息">
              <TooltipTrigger asChild>
                <PopoverTrigger
                  asChild
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Info />
                </PopoverTrigger>
              </TooltipTrigger>
            </Tooltip>
            <PopoverContent
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="w-64"
            >
              <div className="flex flex-col gap-3">
                {row
                  .getAllCells()
                  .filter((c) => c.column.columnDef.id != 'operate')
                  .map((cell, index) => {
                    return (
                      <div className="grid grid-cols-5 text-sm" key={index}>
                        <span className="col-span-2 flex justify-start font-bold">
                          {cell.column.columnDef.header?.toString() ?? ''}
                        </span>
                        <span className="col-span-3 flex flex-wrap justify-end">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </PopoverContent>
          </Popover>

          {operateArea && operateArea(row.original, <CircleEllipsis />, '操作')}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Tooltip content={title}>
          <TooltipTrigger asChild>
            <span className="max-w-36 truncate text-base font-bold group-hover:text-primary-500">{title}</span>
          </TooltipTrigger>
        </Tooltip>

        <span className="text-xs opacity-70">{subtitle}</span>
      </div>

      {/*<div>{operateArea?.(row.original)}</div>*/}
    </div>
  );
};
