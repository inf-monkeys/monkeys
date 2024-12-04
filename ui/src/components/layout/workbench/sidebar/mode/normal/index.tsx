import React, { useRef, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useCreation, useDebounceEffect, useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence } from 'framer-motion';
import { keyBy, map } from 'lodash';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { IWorkbenchViewItemPage } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cloneDeep } from '@/utils';

export const WorkbenchNormalModeSidebar: React.FC = () => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data, isLoading } = useWorkspacePages();
  const [groupId, setGroupId] = useState<string>('default');

  const originalPages = data?.pages ?? [];
  const originalGroups = useCreation(() => {
    return (
      data?.groups
        ?.map((group) => ({
          ...group,
          pageIds: group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId)),
        }))
        ?.filter((group) => group.pageIds.length) ?? []
    );
  }, [data?.groups, originalPages]);

  const pagesMap = keyBy(originalPages, 'id');
  const lists = map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]).filter(Boolean),
  }))
    .filter((it) => it.pages?.length)
    .sort((a) => (a.isBuiltIn ? -1 : 1));

  const [{ activePage }] = useUrlState<{ activePage: string }>({ activePage: '' });
  const toggleToActivePageRef = useRef(activePage ? false : null);

  const [currentPage, setCurrentPage] = useLocalStorage<Partial<IWorkbenchViewItemPage>>('vines-ui-workbench-page', {});

  const latestOriginalPages = useLatest(originalPages);
  const latestOriginalGroups = useLatest(originalGroups);
  useDebounceEffect(
    () => {
      if (!teamId) return;

      const pagesLength = latestOriginalPages.current.length;
      const groupsLength = latestOriginalGroups.current.length;
      if (!pagesLength) return;

      const currentTeamPage = currentPage?.[teamId] ?? {};
      const currentPageId = currentTeamPage?.id;

      if (toggleToActivePageRef.current === false) {
        const page = latestOriginalPages.current.find((it) => it.workflowId === activePage);
        const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(page?.id ?? ''));
        if (page && groupWithPageId) {
          setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
          setGroupId(groupWithPageId.id);
          toggleToActivePageRef.current = true;
          return;
        }
      }

      const setEmptyOrFirstPage = () => {
        if (pagesLength && groupsLength) {
          const sortedGroups = cloneDeep(latestOriginalGroups.current).sort((a) => (a.isBuiltIn ? 1 : -1));
          sortedGroups.forEach(({ id, pageIds }) => {
            if (pageIds.length) {
              const firstPage = latestOriginalPages.current.find((it) => it.id === pageIds[0]);
              if (firstPage) {
                setCurrentPage((prev) => ({ ...prev, [teamId]: firstPage }));
                setGroupId(id);
                return;
              }
            }
          });
          return;
        }

        setCurrentPage((prev) => ({ ...prev, [teamId]: {} }));
      };

      if (currentPageId) {
        const page = latestOriginalPages.current.find((it) => it.id === currentPageId);
        if (page) {
          const groupIdWithPage = latestOriginalGroups.current.find(
            (it) => it.id === (currentTeamPage?.groupId || currentPageId),
          );
          if (groupIdWithPage) {
            setGroupId(groupIdWithPage.id);
          } else {
            setEmptyOrFirstPage();
          }
        } else {
          setEmptyOrFirstPage();
        }
      } else {
        setEmptyOrFirstPage();
      }
    },
    [currentPage?.[teamId], data, teamId],
    { wait: 210 },
  );

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight - 74);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className="relative mr-4 flex h-full w-72 rounded-xl border border-input bg-slate-1 shadow-sm" ref={ref}>
      <AnimatePresence>{isLoading && <VinesFullLoading disableCard />}</AnimatePresence>
      <div className="grid w-full overflow-hidden p-4 [&_h1]:line-clamp-1 [&_span]:line-clamp-1">
        <VirtuaWorkbenchViewList
          height={height}
          data={lists}
          currentPageId={currentPage?.[teamId]?.id}
          currentGroupId={groupId}
          onChildClick={(page) => {
            setCurrentPage((prev) => ({ ...prev, [teamId]: page }));
            setGroupId(page.groupId);
          }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/$teamId/workflows/" params={{ teamId }}>
              <Button icon={<Plus />} className="mt-2 w-full" variant="outline" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t('workbench.sidebar.add')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
