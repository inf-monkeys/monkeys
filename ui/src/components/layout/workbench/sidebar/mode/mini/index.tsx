import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useCreation, useDebounceEffect, useDebounceFn, useLatest, useThrottleEffect } from 'ahooks';
import { motion } from 'framer-motion';
import { get, isUndefined, keyBy } from 'lodash';

import { useSystemConfig } from '@/apis/common';
import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { useWorkflowExecutionSimple } from '@/apis/workflow/execution';
import { WorkbenchMiniGroupList } from '@/components/layout/workbench/sidebar/mode/mini/group.tsx';
import { VirtuaWorkbenchMiniViewList } from '@/components/layout/workbench/sidebar/mode/mini/virtua';
import { pageGroupProcess } from '@/components/layout/workbench/sidebar/mode/utils';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { VINES_IFRAME_PAGE_TYPE2ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';
import { cn, getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IWorkbenchMiniModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchMiniModeSidebar: React.FC<IWorkbenchMiniModeSidebarProps> = () => {
  const { data } = useWorkspacePages();

  const [
    {
      sidebarFilter: routeSidebarFilter,
      sidebarReserve: routeSidebarReserve,
      activePageFromWorkflowDisplayName,
      activePageFromWorkflowInstanceId,
    },
  ] = useUrlState<{
    sidebarFilter?: string;
    sidebarReserve?: string;
    activePageFromWorkflowDisplayName?: string;
    activePageFromWorkflowInstanceId?: string;
  }>();

  const { data: workflowExecution } = useWorkflowExecutionSimple(activePageFromWorkflowInstanceId);

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
  const lists = pageGroupProcess(originalGroups, pagesMap);

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
  const toggleToActivePageRef = useRef(
    activePage || activePageFromWorkflowDisplayName || workflowExecution ? false : null,
  );

  // const [currentPage, setCurrentPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});
  const currentPage = useCurrentPage();
  const setCurrentPage = useSetCurrentPage();

  const latestOriginalPages = useLatest(originalPages ?? []);
  const latestOriginalGroups = useLatest(originalGroups);
  const prevPageRef = useRef<string>();
  useDebounceEffect(
    () => {
      if (!teamId || latestOriginalPages.current === null) return;

      if (
        toggleToActivePageRef.current === false &&
        (activePage || activePageFromWorkflowDisplayName || workflowExecution)
      ) {
        const page = latestOriginalPages.current.find((it) => {
          if (workflowExecution) {
            return it.workflowId === workflowExecution.workflowId;
          }
          if (activePage) {
            return it.workflowId === activePage;
          }
          if (activePageFromWorkflowDisplayName && it.workflow) {
            return getI18nContent(it.workflow.displayName) === activePageFromWorkflowDisplayName;
          }
          return false;
        });
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
    [originalPages, activePageFromWorkflowDisplayName, workflowExecution],
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

  const { data: oem } = useSystemConfig();
  const themeMode = get(oem, 'theme.themeMode', 'shadow');
  // 根据主题模式应用不同圆角样式
  const isShadowMode = themeMode === 'shadow';
  const roundedClass = isShadowMode ? 'rounded-bl-lg rounded-tl-lg' : 'rounded-bl-xl rounded-tl-xl';

  return (
    <motion.div
      className={cn(
        `min-w-30 relative flex h-screen max-w-56 gap-2 ${roundedClass} border border-input bg-slate-1 p-2`,
      )}
      ref={ref}
    >
      <div className="flex min-w-10 flex-col">
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
