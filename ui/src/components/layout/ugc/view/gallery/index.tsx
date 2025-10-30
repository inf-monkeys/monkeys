import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { IUgcViewItemProps } from '@/components/layout/ugc/typings.ts';
import { useColumnRenderer } from '@/components/layout/ugc/view/utils/node-renderer.tsx';
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

  // 判断是否置顶
  const isPinned = ((row.original as any).sort ?? 0) > 0;

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

        {/* 置顶标识 - 左上角 */}
        {/* {isPinned && (
          <div className="absolute top-2 left-2 z-10">
            <Tooltip content={t('common.utils.pinned')}>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center">
                  <Pin size={16} className="text-white fill-white" />
                </div>
              </TooltipTrigger>
            </Tooltip>
          </div>
        )} */}

        {/* 右下角操作按钮 */}
        <div className="absolute flex translate-x-[-0.5rem] translate-y-[-0.5rem] cursor-pointer gap-1 opacity-0 transition-all group-hover:opacity-100">
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
