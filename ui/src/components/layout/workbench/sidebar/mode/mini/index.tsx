import React, { useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useThrottleEffect } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cn, getI18nContent } from '@/utils';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { t } = useTranslation();

  const { data } = useWorkspacePages();

  const [{ sidebarFilter: routeSidebarFilter, sidebarReserve: routeSidebarReserve }] = useUrlState<{
    sidebarFilter?: string;
    sidebarReserve?: string;
  }>();

  const originalPages = useCreation(() => {
    const sidebarFilter = (routeSidebarFilter?.toString() ?? '')?.split(',')?.filter(Boolean);

    if (sidebarFilter.length > 0) {
      return (
        data?.pages.filter(({ type }) => sidebarFilter.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []
      );
    }

    const sidebarReserve = (routeSidebarReserve?.toString() ?? '')?.split(',')?.filter(Boolean);
    if (sidebarReserve.length > 0) {
      return (
        data?.pages.filter(({ type }) => sidebarReserve.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []
      );
    }

    return data?.pages ?? [];
  }, [routeSidebarFilter, routeSidebarReserve, data?.pages]);

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      const currentPageId = currentPage?.id;

      if (currentPageId) {
        if (!originalPages?.find((page) => page.id === currentPageId)) {
          setCurrentPage({});
        }
      } else {
        const page = originalPages.find((it) => it.id !== currentPageId);
        if (page && prevPageRef.current !== page.id) {
          setCurrentPage(page);
          prevPageRef.current = page.id;
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full w-20 py-2" ref={ref}>
      <div className="-mt-2 flex w-full flex-col gap-4 px-2">
        <ScrollArea ref={scrollAreaRef} style={{ height }} disabledOverflowMask>
          <Virtuoso
            style={{ height }}
            data={originalPages}
            customScrollParent={scrollAreaRef.current as HTMLElement}
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
                  <span className="text-xxs text-center">
                    {getI18nContent(info?.displayName) ?? t('common.utils.untitled')}
                  </span>
                </div>
              );
            }}
          />
        </ScrollArea>
      </div>
      <Separator orientation="vertical" />
    </div>
  );
};
