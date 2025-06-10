import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link } from '@tanstack/react-router';

import { useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence } from 'framer-motion';
import { keyBy, map } from 'lodash';
import { CircleSlash, Maximize2Icon, Minimize2Icon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { useOnlyShowWorkbenchIcon, useToggleOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';
import { cloneDeep, cn, getI18nContent } from '@/utils';

import { VirtuaWorkbenchViewGroupList } from './group-virua';
import { WorkbenchViewItemCurrentData } from './virtua/item';

interface IWorkbenchNormalModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  showGroup?: boolean;
}

export const WorkbenchNormalModeSidebar: React.FC<IWorkbenchNormalModeSidebarProps> = ({ showGroup = true }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const { data, isLoading } = useWorkspacePages();

  const [{ activePageFromWorkflowDisplayName }, setUrlState] = useUrlState<{
    activePageFromWorkflowDisplayName?: string;
  }>({});

  const [groupId, setGroupId] = useState<string>('default');
  const [pageId, setPageId] = useState<string>('');
  // const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const originalPages = data?.pages ?? [];
  const originalGroups = useMemo(() => {
    return (
      data?.groups
        ?.map((group) => ({
          ...group,
          pageIds: group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId)),
        }))
        ?.filter((group) => group.pageIds.length) ?? []
    );
  }, [data?.groups, originalPages, data]);

  const pagesMap = keyBy(originalPages, 'id');
  const groupMap = new Map(originalGroups.map((item, index) => [item.id, index]));
  const lists = map(originalGroups, ({ pageIds, ...attr }) => ({
    ...attr,
    pages: map(pageIds, (pageId) => pagesMap[pageId]).filter(Boolean),
  }))
    .filter((it) => it.pages?.length)
    .sort((a, b) => {
      if (a.isBuiltIn !== b.isBuiltIn) {
        return a.isBuiltIn ? -1 : 1;
      }
      return (groupMap.get(a.id) ?? Infinity) - (groupMap.get(b.id) ?? Infinity);
      // return a.displayName.localeCompare(b.displayName, undefined, { numeric: true });
    });

  const [{ activePage }] = useUrlState<{ activePage: string }>({ activePage: '' });
  const toggleToActivePageRef = useRef(activePage ? false : null);

  // const [currentPage, setCurrentPage] = useLocalStorage<Partial<IWorkbenchViewItemPage>>('vines-ui-workbench-page', {});
  const currentPage = useCurrentPage();
  const setCurrentPage = useSetCurrentPage();
  const latestOriginalPages = useLatest(originalPages);
  const latestOriginalGroups = useLatest(originalGroups);
  useEffect(() => {
    if (!teamId) return;

    const pagesLength = latestOriginalPages.current.length;
    const groupsLength = latestOriginalGroups.current.length;
    if (!pagesLength) return;

    if (activePageFromWorkflowDisplayName) {
      const targetPage = latestOriginalPages.current.find(
        (it) => getI18nContent(it.workflow?.displayName) === activePageFromWorkflowDisplayName,
      );
      if (targetPage) {
        const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(targetPage?.id ?? ''));
        setPageId(targetPage.id);
        setCurrentPage({ [teamId]: targetPage });
        groupWithPageId && setGroupId(groupWithPageId.id);
        return;
      }
    }

    const currentTeamPage = currentPage?.[teamId] ?? {};
    const currentPageId = currentTeamPage?.id;

    if (currentPageId) setPageId(currentPageId);

    if (toggleToActivePageRef.current === false) {
      const page = latestOriginalPages.current.find((it) => it.workflowId === activePage);
      const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(page?.id ?? ''));
      if (page && groupWithPageId) {
        setCurrentPage({ [teamId]: page });
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
              // setCurrentPage((prev) => ({ ...prev, [teamId]: firstPage }));
              setCurrentPage({ [teamId]: firstPage });
              setGroupId(id);
              return;
            }
          }
        });
        return;
      }

      setCurrentPage({ [teamId]: {} });
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
  }, [currentPage?.[teamId], data, teamId, activePageFromWorkflowDisplayName]);

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
  const toggleOnlyShowWorkbenchIcon = useToggleOnlyShowWorkbenchIcon();

  const hasGroups = lists.length && !isLoading;
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const onPageClick = useCallback(
    (page) => {
      startTransition(() => {
        // setCurrentPage((prev) => ({ ...prev, [teamId]: { ...page, groupId } }));
        // setUrlState({ activePageFromWorkflowDisplayName: undefined });
        setCurrentPage({ [teamId]: { ...page, groupId } });
      });
    },
    [teamId, groupId, setCurrentPage],
  );
  return (
    <div
      className={cn('mr-4 flex h-full items-center justify-center rounded-xl border border-input bg-neocard shadow-sm')}
      ref={ref}
    >
      {isLoading ? (
        <AnimatePresence>
          <VinesFullLoading disableCard />
        </AnimatePresence>
      ) : (
        <WorkbenchViewItemCurrentData.Provider value={{ pageId, groupId }}>
          {hasGroups ? (
            showGroup ? (
              <>
                <div
                  style={{
                    height: '100%',
                    // maxWidth: !onlyShowWorkbenchIcon ? '20rem' : '0',
                    // minWidth: !onlyShowWorkbenchIcon ? '8rem' : '8rem',
                  }}
                  className="flex justify-between rounded-l-xl bg-slate-1"
                >
                  {/* leftmost nav */}
                  <VirtuaWorkbenchViewGroupList data={lists} groupId={groupId} setGroupId={setGroupId} />
                </div>
                {/* <Separator orientation="vertical" className="vines-center">
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
                </Separator> */}
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
          <div className="grid h-full grid-rows-[1fr_auto] rounded-r-xl bg-slate-1 [&_h1]:line-clamp-1 [&_span]:line-clamp-1">
            {/* Second nav */}
            <VirtuaWorkbenchViewList
              height={height}
              data={(lists?.find((it) => it.id === groupId)?.pages ?? []) as IPinPage[]}
              currentPageId={currentPage?.[teamId]?.id}
              currentGroupId={groupId}
              onChildClick={onPageClick}
            />
            <div
              className={cn(
                'flex items-center justify-between gap-4 px-4 pb-4 pt-2',
                onlyShowWorkbenchIcon && 'justify-center',
              )}
            >
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    onClick={() => toggleOnlyShowWorkbenchIcon()}
                    icon={onlyShowWorkbenchIcon ? <Maximize2Icon /> : <Minimize2Icon />}
                    size={'icon'}
                    className={cn('shrink-0', onlyShowWorkbenchIcon && '')}
                    variant="outline"
                  />
                </TooltipTrigger>
                <TooltipContent className="z-20">{t('workbench.sidebar.toggle')}</TooltipContent>
              </Tooltip>
              {!onlyShowWorkbenchIcon && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="vines-center shrink grow">
                      <Link to="/$teamId/workflows/" className="contents" params={{ teamId }}>
                        <Button icon={<PlusIcon />} className="shrink grow" variant="outline" />
                      </Link>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent align="start" side="top" className="z-10">
                    {t('workbench.sidebar.add')}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </WorkbenchViewItemCurrentData.Provider>
      )}
    </div>
  );
};
