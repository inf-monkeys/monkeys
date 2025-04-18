import React, { useEffect, useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useDebounceFn, useLatest, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { isUndefined } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchMiniViewList } from '@/components/layout/workbench/sidebar/mode/mini/virtua';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> { }

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { t } = useTranslation();

  const { data } = useWorkspacePages();

  const [{ sidebarFilter: routeSidebarFilter, sidebarReserve: routeSidebarReserve }] = useUrlState<{
    sidebarFilter?: string;
    sidebarReserve?: string;
  }>();

  const originalPages = useCreation(() => {
    if (isUndefined(data)) return null;

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

  const [{ activePage }] = useUrlState<{ activePage: string }>({ activePage: '' });
  const toggleToActivePageRef = useRef(activePage ? false : null);

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const latestOriginalPages = useLatest(originalPages ?? []);
  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      if (!teamId || latestOriginalPages.current === null) return;

      if (toggleToActivePageRef.current === false && activePage) {
        const page = latestOriginalPages.current.find((it) => it.workflowId === activePage);
        if (page) {
          setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
          toggleToActivePageRef.current = true;
          return;
        }
      }

      const currentPageId = currentPage?.[teamId]?.id;

      if (currentPageId) {
        if (!latestOriginalPages.current.find((page) => page.id === currentPageId)) {
          setCurrentPage((prev) => ({ ...prev, [teamId]: {} }));
        }
      } else {
        const page = latestOriginalPages.current.find((it) => it.id !== currentPageId);
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

  const { run: handleToggleActiveViewByWorkflowId } = useDebounceFn(
    (workflowId: string) => {
      const page = latestOriginalPages.current.find((it) => it.workflowId === workflowId);
      if (page) {
        setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
      }
    },
    {
      wait: 100,
    },
  );
  useEffect(() => {
    VinesEvent.on('view-toggle-active-view-by-workflow-id', handleToggleActiveViewByWorkflowId);
    return () => {
      VinesEvent.off('view-toggle-active-view-by-workflow-id', handleToggleActiveViewByWorkflowId);
    };
  }, []);

  const [{ sidebar }] = useUrlState<{ sidebar: 'default' | 'embed' }>({ sidebar: 'default' });
  const isUseFixedSidebar = sidebar === 'default';


  return (
    <motion.div
      className={cn(
        'relative flex h-full min-w-14 max-w-20 rounded-tl-xl rounded-bl-xl border border-input bg-slate-1 py-2',
      )}
      ref={ref}
    >
      <div className="flex w-full flex-col gap-4 px-2">
        <VirtuaWorkbenchMiniViewList
          data={originalPages}
          height={height}
          currentPageId={currentPage?.[teamId]?.id}
          onItemClicked={(page) => {
            setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
          }}
          mini={!isUseFixedSidebar}
        />
      </div>
    </motion.div>
  );
};
