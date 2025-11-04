import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { flexRender } from '@tanstack/react-table';
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
  ugcOptions,
}: IUgcViewItemProps<E>) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cells = row.getAllCells();

  const render = useColumnRenderer({ row, columns, renderOptions, cells, ugcOptions });

  const cover = render('cover');
  const title = render('title');
  const subtitle = render('subtitle');

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 跳转到资产详情页面（根据当前 URL 动态识别 navId，默认回退到 design-assets）
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = path.match(/\/[^/]+\/nav\/([^/]+)/);
    const currentNavId = match?.[1] ?? 'concept-design:design-assets';
    navigate({ to: `/$teamId/nav/${currentNavId}/asset/${row.original.id}` as any });
  };

  // 判断是否应该显示查看信息按钮
  // 只显示在：concept-design:design-assets 和 concept-design:design-models/neural-models
  const shouldShowInfoButton = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;

    // 检查是否是 concept-design:design-assets
    const isDesignAssets = path.includes('/nav/concept-design:design-assets');

    // 检查是否是 concept-design:design-models/neural-models
    const isNeuralModels = path.includes('/nav/concept-design:design-models/neural-models');

    return isDesignAssets || isNeuralModels;
  }, []);

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
        {/* 右下角操作按钮 */}
        <div className="absolute flex translate-x-[-0.5rem] translate-y-[-0.5rem] cursor-pointer gap-1 opacity-0 transition-all group-hover:opacity-100">
          {shouldShowInfoButton ? (
            <Tooltip content={t('common.utils.info')}>
              <TooltipTrigger asChild>
                <div onClick={handleInfoClick} className="flex items-center justify-center">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-md"
                  >
                    <circle cx="12" cy="12" r="10" fill="rgb(var(--vines-500))" />
                    <path
                      d="M12 16v-4M12 8h.01"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </TooltipTrigger>
            </Tooltip>
          ) : (
            <Popover>
              <Tooltip content={t('common.utils.info')}>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-md"
                      >
                        <circle cx="12" cy="12" r="10" fill="rgb(var(--vines-500))" />
                        <path
                          d="M12 16v-4M12 8h.01"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
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
          )}

          {operateArea &&
            operateArea(
              row.original,
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
              >
                <circle cx="12" cy="12" r="10" fill="rgb(var(--vines-500))" />
                <circle cx="7" cy="12" r="1.5" fill="white" />
                <circle cx="12" cy="12" r="1.5" fill="white" />
                <circle cx="17" cy="12" r="1.5" fill="white" />
              </svg>,
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
