import React, { useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useThrottleEffect } from 'ahooks';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchMiniViewList } from '@/components/layout/workbench/sidebar/mode/mini/virtua';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
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

  return (
    <div className="flex h-full w-20 py-2" ref={ref}>
      <div className="-mt-2 flex w-full flex-col gap-4 px-2">
        <VirtuaWorkbenchMiniViewList
          data={originalPages}
          height={height}
          currentPageId={currentPage?.[teamId]?.id}
          onItemClicked={(page) => setCurrentPage((prev) => ({ ...prev, [teamId]: page }))}
        />
      </div>
      <Separator orientation="vertical" />
    </div>
  );
};
