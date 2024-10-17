import React, { useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchMiniViewList } from '@/components/layout/workbench/sidebar/mode/mini/virtua';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cn } from '@/utils';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { t } = useTranslation();

  const { data } = useWorkspacePages();

  const [{ sidebarFilter: routeSidebarFilter, sidebarReserve: routeSidebarReserve }] = useUrlState<{
    sidebarFilter?: string;
    sidebarReserve?: string;
  }>();

  const originalPages = useCreation(() => {
    const pageIdsForSort = Array.from(new Set(data?.groups.flatMap((it) => it.pageIds)));

    const sidebarFilter = (routeSidebarFilter?.toString() ?? '')?.split(',')?.filter(Boolean);
    if (sidebarFilter.length > 0) {
      return (
        data?.pages.filter(({ type }) => sidebarFilter.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []
      ).sort((a, b) => {
        const aIndex = pageIdsForSort.indexOf(a.id);
        const bIndex = pageIdsForSort.indexOf(b.id);
        return aIndex - bIndex;
      });
    }

    const sidebarReserve = (routeSidebarReserve?.toString() ?? '')?.split(',')?.filter(Boolean);
    if (sidebarReserve.length > 0) {
      return (
        data?.pages.filter(({ type }) => sidebarReserve.includes(VINES_IFRAME_PAGE_TYPE2ID_MAPPER[type] || type)) ?? []
      ).sort((a, b) => {
        const aIndex = pageIdsForSort.indexOf(a.id);
        const bIndex = pageIdsForSort.indexOf(b.id);
        return aIndex - bIndex;
      });
    }

    return data?.pages ?? [];
  }, [routeSidebarFilter, routeSidebarReserve, data?.pages]);

  const { teamId } = useVinesTeam();
  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      if (!teamId) return;

      const currentPageId = currentPage?.[teamId]?.id;

      if (currentPageId) {
        if (!originalPages?.find((page) => page.id === currentPageId)) {
          setCurrentPage((prev) => ({ ...prev, [teamId]: {} }));
        }
      } else {
        const page = originalPages.find((it) => it.id !== currentPageId);
        if (page && prevPageRef.current !== page.id) {
          setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
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

  const [{ sidebar }] = useUrlState<{ sidebar: 'default' | 'embed' }>({ sidebar: 'default' });
  const isUseFixedSidebar = sidebar === 'default';

  const [sidebarVisible, setSidebarVisible] = useState(!isUseFixedSidebar);

  return (
    <motion.div
      className={cn(
        'relative flex h-full min-w-14 max-w-20 border-r border-input bg-slate-1 py-2',
        isUseFixedSidebar && 'absolute z-50 min-w-20 shadow-md',
      )}
      initial={{ marginLeft: isUseFixedSidebar ? -80 : 0 }}
      animate={{ marginLeft: sidebarVisible ? 0 : isUseFixedSidebar ? -80 : -55 }}
      ref={ref}
    >
      <div className="-mt-2 flex w-full flex-col gap-4 px-2">
        <VirtuaWorkbenchMiniViewList
          data={originalPages}
          height={height}
          currentPageId={currentPage?.[teamId]?.id}
          onItemClicked={(page) => {
            setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
            setSidebarVisible(false);
          }}
          mini={!isUseFixedSidebar}
        />
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="group absolute -right-32 top-5 z-10 h-6 cursor-pointer pl-32"
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <div className="absolute left-0 flex h-6 w-3.5 items-center justify-center rounded-r-sm border border-input bg-border shadow">
              <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="cursor-pointer" sideOffset={10} onClick={() => setSidebarVisible(!sidebarVisible)}>
          {sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
};
