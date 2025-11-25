import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { flexRender } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { IUgcViewItemProps } from '@/components/layout/ugc/typings.ts';
import { useColumnRenderer } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

// 支持跳转到详情页（新页面）的 assetType 白名单
const DETAIL_PAGE_WHITELIST = ['media-data', 'neural-models'];

export const UgcViewGalleryItem = <E extends object>({
  row,
  columns,
  renderOptions,
  operateArea,
  onItemClick,
  ugcOptions,
  assetType,
  assetKey,
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

    // 从 URL 中提取 teamId 和 navId
    const teamIdMatch = path.match(/\/([^/]+)\//);
    const teamId = teamIdMatch?.[1] ?? '';
    const navMatch = path.match(/\/[^/]+\/nav\/([^/]+)/);
    const currentNavId = navMatch?.[1] ?? 'concept-design:design-assets';
    const targetUrl = `/${teamId}/nav/${currentNavId}/asset/${row.original.id}`;

    navigate({ to: targetUrl as any });
  };

  // 判断是否应该显示查看信息按钮（跳转到新的详情页 vs 显示简单的 Popover）
  // 优先使用 assetKey，因为白名单是基于 assetKey 的（如 media-data），而不是 assetType（如 media-file）
  const shouldShowInfoButton = React.useMemo(() => {
    // 优先使用 assetKey（因为白名单是基于 assetKey 的）
    let currentAssetType: string | undefined = assetKey
      ? assetKey.includes(':')
        ? assetKey.split(':')[1]
        : assetKey
      : undefined;

    // 如果没有 assetKey，尝试使用传入的 assetType
    if (!currentAssetType && assetType) {
      currentAssetType = assetType as string | undefined;
    }

    // 如果还是没有，从 URL 中提取（兼容旧逻辑）
    if (!currentAssetType && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/\/[^/]+\/nav\/([^/]+)/);
      const navId = match?.[1] ?? '';
      currentAssetType = navId.includes(':') ? navId.split(':')[1] : navId;
    }

    // 检查 assetType 是否在白名单中
    return currentAssetType ? DETAIL_PAGE_WHITELIST.includes(currentAssetType) : false;
  }, [assetType, assetKey]);

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
