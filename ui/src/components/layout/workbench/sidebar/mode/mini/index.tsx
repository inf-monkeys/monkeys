import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useDebounceFn, useLatest, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { isUndefined, keyBy, map } from 'lodash';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { WorkbenchMiniGroupList } from '@/components/layout/workbench/sidebar/mode/mini/group.tsx';
import { VirtuaWorkbenchMiniViewList } from '@/components/layout/workbench/sidebar/mode/mini/virtua';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { data } = useWorkspacePages();

  const [{ sidebarFilter: routeSidebarFilter, sidebarReserve: routeSidebarReserve, switchWorkflowFromDisplayName }] =
    useUrlState<{
      sidebarFilter?: string;
      sidebarReserve?: string;
      switchWorkflowFromDisplayName?: string;
    }>();

  const [groupId, setGroupId] = useState<string>('default');

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

  const originalGroups = useMemo(() => {
    return (
      data?.groups
        ?.map((group) => ({
          ...group,
          pageIds: group.pageIds.filter((pageId) => (originalPages ?? []).some((it) => it.id === pageId)),
        }))
        ?.filter((group) => group.pageIds.length) ?? []
    );
  }, [data?.groups, originalPages, data]);

  const pagesMap = keyBy(originalPages ?? [], 'id');
  const lists = map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]).filter(Boolean),
  }))
    .filter((it) => it.pages?.length)
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) {
        return a.isBuiltIn ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName, undefined, { numeric: true });
    });

  // Get current group's pages for display
  const currentGroupPages = (lists?.find((it) => it.id === groupId)?.pages ?? []) as IPinPage[];

  // Auto-select first group if current groupId doesn't exist in lists
  useEffect(() => {
    if (lists.length > 0 && groupId === 'default' && !lists.find((it) => it.id === groupId)) {
      setGroupId(lists[0].id);
    }
  }, [lists, groupId]);

  const { teamId } = useVinesTeam();

  const [{ activePage }] = useUrlState<{ activePage: string }>({ activePage: '' });
  const toggleToActivePageRef = useRef(activePage ? false : null);

  // const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});
  const currentPage = useCurrentPage();
  const setCurrentPage = useSetCurrentPage();

  const latestOriginalPages = useLatest(originalPages ?? []);
  const latestOriginalGroups = useLatest(originalGroups);
  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      if (!teamId || latestOriginalPages.current === null) return;

      if (toggleToActivePageRef.current === false && activePage) {
        const page = latestOriginalPages.current.find((it) => it.workflowId === activePage);
        if (page) {
          // Find the group that contains this page and set it as active group
          const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(page.id));
          if (groupWithPageId) {
            setGroupId(groupWithPageId.id);
          }
          // setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
          setCurrentPage({ [teamId]: page });
          toggleToActivePageRef.current = true;
          return;
        }
      }

      const currentPageId = currentPage?.[teamId]?.id;

      if (currentPageId) {
        if (!latestOriginalPages.current.find((page) => page.id === currentPageId)) {
          // setCurrentPage((prev) => ({ ...prev, [teamId]: {} }));
          setCurrentPage({ [teamId]: {} });
        }
      } else {
        const page = latestOriginalPages.current.find((it) => it.id !== currentPageId);
        if (page && prevPageRef.current !== page.id) {
          // Find the group that contains this page and set it as active group
          const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(page.id));
          if (groupWithPageId) {
            setGroupId(groupWithPageId.id);
          }
          // setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
          setCurrentPage({ [teamId]: page });
          prevPageRef.current = page.id;
        }
      }
    },
    [originalPages, switchWorkflowFromDisplayName],
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
        // Find the group that contains this page and set it as active group
        const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(page.id));
        if (groupWithPageId) {
          setGroupId(groupWithPageId.id);
        }
        // setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
        setCurrentPage({ [teamId]: page });
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
        'relative flex h-screen min-w-24 max-w-56 gap-2 rounded-bl-xl rounded-tl-xl border border-input bg-slate-1 px-2 py-2',
      )}
      ref={ref}
    >
      <div className="flex w-8 min-w-10 flex-col">
        <WorkbenchMiniGroupList data={lists} groupId={groupId} setGroupId={setGroupId} height={height} />
      </div>
      <div className="h-full w-px bg-input" />
      <div className="flex min-w-10 flex-col">
        <VirtuaWorkbenchMiniViewList
          data={currentGroupPages}
          height={height}
          currentPageId={currentPage?.[teamId]?.id}
          onItemClicked={(page) => {
            // setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
            setCurrentPage({ [teamId]: page });
          }}
          mini={!isUseFixedSidebar}
        />
      </div>
    </motion.div>
  );
};
