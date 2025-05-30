import React, { startTransition, useRef, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useCreation, useDebounceEffect, useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { keyBy, map } from 'lodash';
import { ChevronRight, CircleSlash, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchViewGroupList } from '@/components/layout/workbench/sidebar/mode/normal/group-virua';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { IWorkbenchViewItemPage } from '@/components/layout/workbench/sidebar/mode/normal/virtua/item.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cloneDeep, cn } from '@/utils';

interface IWorkbenchNormalModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  showGroup?: boolean;
}

export const WorkbenchNormalModeSidebar: React.FC<IWorkbenchNormalModeSidebarProps> = ({ showGroup = true }) => {
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
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) {
        return a.isBuiltIn ? -1 : 1;
      }
      return a.displayName.localeCompare(b.displayName, undefined, { numeric: true });
    });

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

  const hasGroups = lists.length && !isLoading;

  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <motion.div
      animate={{
        width: showGroup ? (sidebarVisible ? '24rem' : '16rem') : '16rem',
      }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative mr-4 flex h-full items-center justify-center rounded-xl border border-input bg-slate-1 shadow-sm',
      )}
      ref={ref}
    >
      {isLoading ? (
        <AnimatePresence>
          <VinesFullLoading disableCard />
        </AnimatePresence>
      ) : (
        <>
          {hasGroups ? (
            showGroup ? (
              <>
                <motion.div
                  initial={{ minWidth: '8rem', height: '100%' }}
                  animate={{
                    maxWidth: sidebarVisible ? '20rem' : '0',
                    minWidth: sidebarVisible ? '8rem' : '0',
                    height: '100%',
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <VirtuaWorkbenchViewGroupList data={lists} groupId={groupId} setGroupId={setGroupId} />
                </motion.div>
                <Separator orientation="vertical" className="vines-center">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="group z-10 flex h-4 w-3.5 cursor-pointer items-center justify-center rounded-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                      >
                        <ChevronRight className={cn(sidebarVisible && 'scale-x-[-1]')} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sidebarVisible ? t('common.sidebar.hide') : t('common.sidebar.show')}
                    </TooltipContent>
                  </Tooltip>
                </Separator>
              </>
            ) : (
              <></>
            )
          ) : (
            <div className="vines-center absolute flex-col gap-4">
              <CircleSlash size={64} />
              <div className="flex flex-col text-center">
                <h2 className="font-bold">{t('workbench.view.no-starred-view')}</h2>
              </div>
            </div>
          )}
          <div className="grid w-full overflow-hidden p-4 [&_h1]:line-clamp-1 [&_span]:line-clamp-1">
            <VirtuaWorkbenchViewList
              height={height}
              data={(lists?.find((it) => it.id === groupId)?.pages ?? []) as IPinPage[]}
              currentPageId={currentPage?.[teamId]?.id}
              currentGroupId={groupId}
              onChildClick={(page) => {
                startTransition(() => {
                  setCurrentPage((prev) => ({ ...prev, [teamId]: { ...page, groupId } }));
                });
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
        </>
      )}
    </motion.div>
  );
};
