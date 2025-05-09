import React from 'react';

import { flexRender } from '@tanstack/react-table';
import { CircleEllipsis, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IUgcViewItemProps } from '@/components/layout/ugc/typings.ts';
import { useColumnRenderer } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

export const UgcViewGalleryItem = <E extends object>({
  row,
  columns,
  renderOptions,
  operateArea,
  onItemClick,
}: IUgcViewItemProps<E>) => {
  const { t } = useTranslation();

  const cells = row.getAllCells();

  const render = useColumnRenderer({ row, columns, renderOptions, cells });

  const cover = render('cover');
  const title = render('title');
  const subtitle = render('subtitle');

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
        <div className="absolute flex translate-x-[-0.5rem] translate-y-[-0.5rem] cursor-pointer gap-1 opacity-0 transition-all group-hover:opacity-100">
          <Popover>
            <Tooltip content={t('common.utils.info')}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Info className="stroke-vines-500 opacity-80 drop-shadow-[0_1px_1px_rgb(var(--vines-500)/0.7)]" />
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

          {operateArea &&
            operateArea(
              row.original,
              <CircleEllipsis className="stroke-vines-500 opacity-80 drop-shadow-[0_1px_1px_rgb(var(--vines-500)/0.7)]" />,
              t('common.utils.operate'),
            )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <Tooltip content={title}>
          <TooltipTrigger asChild>
            <span className="group-hover:text-primary-500 max-w-36 truncate text-base font-bold">{title}</span>
          </TooltipTrigger>
        </Tooltip>

        <Tooltip content={subtitle} contentProps={{ side: 'bottom' }}>
          <TooltipTrigger asChild>
            <span className="max-w-36 text-ellipsis text-xs opacity-70">{subtitle}</span>
          </TooltipTrigger>
        </Tooltip>
      </div>
    </div>
  );
};
