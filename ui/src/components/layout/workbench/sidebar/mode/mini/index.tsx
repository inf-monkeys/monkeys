import React, { useState } from 'react';

import { useDebounceEffect, useThrottleEffect } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { Separator } from '@/components/ui/separator.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { t } = useTranslation();

  const { data } = useWorkspacePages();

  const originalPages = data?.pages.filter(({ type }) => type === 'preview') ?? [];

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  useDebounceEffect(
    () => {
      const currentPageId = currentPage?.id;

      if (currentPageId) {
        if (!originalPages?.find((page) => page.id === currentPageId)) {
          setCurrentPage({});
        }
      }
    },
    [originalPages],
    { wait: 180 },
  );

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className="flex h-full w-20 py-2" ref={ref}>
      <div className="flex w-full flex-col gap-4 px-2 -mt-2">
        <Virtuoso
          style={{ height }}
          data={originalPages}
          itemContent={(_, page) => {
            if (!page) {
              return null;
            }

            const info = page?.workflow || page?.agent;
            const pageId = page?.id ?? '';

            return (
              <div
                key={pageId}
                className={cn(
                  'mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-transparent py-2 transition-colors hover:bg-accent hover:text-accent-foreground',
                  currentPage?.id === pageId && 'border-input bg-background text-accent-foreground',
                )}
                onClick={() => {
                  setCurrentPage(page);
                }}
              >
                <VinesIcon size="sm">{info?.iconUrl}</VinesIcon>
                <span className="text-xxs">{getI18nContent(info?.displayName) ?? t('common.utils.untitled')}</span>
              </div>
            );
          }}
        />
      </div>
      <Separator orientation="vertical" />
    </div>
  );
};
