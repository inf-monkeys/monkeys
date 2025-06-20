import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';

import { useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence } from 'framer-motion';
import { keyBy } from 'lodash';
import { CircleSlash, Maximize2Icon, Minimize2Icon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useUpdateGroupPageSort, useUpdateGroupSort, useWorkspacePages } from '@/apis/pages';
import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { pageGroupProcess } from '@/components/layout/workbench/sidebar/mode/utils';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { useOnlyShowWorkbenchIcon, useToggleOnlyShowWorkbenchIcon } from '@/store/showWorkbenchIcon';
import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';
import { cloneDeep, cn, getI18nContent } from '@/utils';

import { VirtuaWorkbenchViewGroupList } from './group-virua';
import { IWorkbenchViewItemPage, WorkbenchViewItemCurrentData } from './virtua/item';

interface IWorkbenchNormalModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  showGroup?: boolean;
}

export const WorkbenchNormalModeSidebar: React.FC<IWorkbenchNormalModeSidebarProps> = ({ showGroup = true }) => {
  const { t } = useTranslation();

  const { teamId } = useVinesTeam();

  const navigate = useNavigate();

  const { data, isLoading, mutate } = useWorkspacePages();

  const { trigger: updateGroupSortTrigger } = useUpdateGroupSort();

  const [{ activePageFromWorkflowDisplayName, activePageFromType }] = useUrlState<{
    activePageFromWorkflowDisplayName?: string;
    activePageFromType?: string;
  }>({});

  const [groupId, setGroupId] = useState<string>('default');
  const [pageId, setPageId] = useState<string>('');
  // const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const originalPages: IPinPage[] = useMemo(() => {
    const pages = [...(data?.pages ?? [])];
    if (!pages.some((page) => page.id === 'global-design-board')) {
      pages.unshift({
        id: 'global-design-board',
        displayName: JSON.stringify({
          'zh-CN': '全局画板',
          'en-US': 'Global Board',
        }),
        type: 'global-design-board',
        workflowId: 'global-design-board',
        isBuiltIn: true,
        instance: {
          name: 'Global Board',
          icon: 'pencil-ruler',
          type: 'global-design-board',
          allowedPermissions: [],
        },
        designProject: {
          id: 'global-design-board',
          name: 'Global Board',
          displayName: JSON.stringify({
            'zh-CN': '全局画板',
            'en-US': 'Global Board',
          }),
          iconUrl: DEFAULT_DESIGN_PROJECT_ICON_URL,
          createdTimestamp: 0,
          updatedTimestamp: 0,
        },
      });
    }
    return pages;
  }, [data?.pages]);
  const originalGroups = useMemo(() => {
    return (
      data?.groups
        ?.map((group) => ({
          ...group,
          pageIds: group.isBuiltIn
            ? ['global-design-board', ...group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId))]
            : group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId)),
        }))
        ?.filter((group) => group.pageIds.length) ?? []
    );
  }, [data?.groups, originalPages, data]);

  const { trigger: updateGroupPageSortTrigger } = useUpdateGroupPageSort(groupId);

  const pagesMap = keyBy(originalPages, 'id');
  // const groupMap = new Map(originalGroups.map((item, index) => [item.id, index]));
  const lists = pageGroupProcess(originalGroups, pagesMap);

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

    if (activePageFromType) {
      const targetPage = latestOriginalPages.current.find((it) => it.type === activePageFromType);
      if (targetPage) {
        setPageId(targetPage.id);
        setCurrentPage({ [teamId]: targetPage });
        const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(targetPage?.id ?? ''));
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
        // 使用 some 来避免多次设置状态
        sortedGroups.some(({ id, pageIds }) => {
          if (pageIds.length) {
            const firstPage = latestOriginalPages.current.find((it) => it.id === pageIds[0]);
            if (firstPage) {
              setCurrentPage({ [teamId]: firstPage });
              setGroupId(id);
              return true; // 找到后立即退出
            }
          }
          return false;
        });
        return;
      }

      // 如果当前没有选中的页面，就不要设置空对象
      if (!currentPage?.[teamId]?.id) {
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
  }, [currentPage?.[teamId], data, teamId, activePageFromWorkflowDisplayName, activePageFromType]);

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
    (page: IWorkbenchViewItemPage) => {
      startTransition(() => {
        navigate({
          search: {},
        });
        setCurrentPage({ [teamId]: { ...page, groupId } });
      });
    },
    [teamId, groupId, setCurrentPage],
  );

  const onPageGroupReorder = (
    newData: (Omit<IPageGroup, 'pageIds'> & {
      pages: IPinPage[];
    })[],
  ) => {
    void updateGroupSortTrigger({
      groupIds: newData.map((it) => it.id),
    }).then(() => {
      void mutate();
    });
  };

  const onPageGroupPageReorder = (newData: IPinPage[]) => {
    void updateGroupPageSortTrigger({
      pageIds: newData.filter((it) => !it.type.startsWith('global-')).map((it) => it.id),
    }).then(() => {
      void mutate();
    });
  };
  return (
    <div
      className={cn('mr-4 flex h-full items-center justify-center rounded-xl border border-input bg-slate-1 shadow-sm')}
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
                <div className="flex h-full justify-between rounded-l-xl bg-slate-1">
                  <VirtuaWorkbenchViewGroupList
                    data={lists}
                    groupId={groupId}
                    setGroupId={setGroupId}
                    onReorder={onPageGroupReorder}
                  />
                </div>
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
              onReorder={onPageGroupPageReorder}
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
