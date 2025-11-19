import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useEventEmitter, useLatest, useThrottleEffect } from 'ahooks';
import { AnimatePresence } from 'framer-motion';
import { get, keyBy } from 'lodash';
import { CircleSlash, Maximize2Icon, Minimize2Icon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomizationFormView, ISystemConfig } from '@/apis/common/typings';
import { useUpdateGroupPageSort, useUpdateGroupSort, useWorkspacePages } from '@/apis/pages';
import { IPageGroup, IPinPage } from '@/apis/pages/typings.ts';
import { useWorkflowExecutionSimple } from '@/apis/workflow/execution';
import { VirtuaWorkbenchViewList } from '@/components/layout/workbench/sidebar/mode/normal/virtua';
import { pageGroupProcess } from '@/components/layout/workbench/sidebar/mode/utils';
import { VinesTabular } from '@/components/layout/workspace/vines-view/form/tabular';
import { VinesViewWrapper } from '@/components/layout-wrapper/workspace/view-wrapper';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';
import { VinesFullLoading } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GlobalDesignBoardOperationBarArea } from '@/components/ui/vines-iframe/view/global-design-board-operation-bar/area';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import {
  useOnlyShowWorkbenchIcon,
  useSetOnlyShowWorkbenchIcon,
  useToggleOnlyShowWorkbenchIcon,
} from '@/store/showWorkbenchIcon';
import { CanvasStoreProvider, createCanvasStore } from '@/store/useCanvasStore';
import { useCurrentPage, useSetCurrentPage } from '@/store/useCurrentPageStore';
import { DesignBoardProvider } from '@/store/useDesignBoardStore';
import { getGlobalDesignBoardStore } from '@/store/useDesignBoardStore/shared';
import { createExecutionStore, ExecutionStoreProvider } from '@/store/useExecutionStore';
import { createFlowStore, FlowStoreProvider } from '@/store/useFlowStore';
import { useGlobalViewSize, useSetEmbedSidebar } from '@/store/useGlobalViewStore';
import { useSetWorkbenchCacheVal } from '@/store/workbenchFormInputsCacheStore';
import { cloneDeep, cn, getI18nContent } from '@/utils';

import { GLOBAL_DESIGN_BOARD_PAGE, GLOBAL_DESIGN_BOARD_PAGE_GROUP } from './consts';
import { WorkbenchSidebarNormalModeEmbedContent } from './embed-content';
import { VirtuaWorkbenchViewGroupList } from './group-virua';
import { IWorkbenchViewItemPage, WorkbenchViewItemCurrentData } from './virtua/item';

const EMBED_TYPE_LIST = ['preview', 'global-design-board'];

interface IWorkbenchNormalModeSidebarProps extends React.ComponentPropsWithoutRef<'div'> {
  showGroup?: boolean;
  collapsed?: boolean;
}

export const WorkbenchNormalModeSidebar: React.FC<IWorkbenchNormalModeSidebarProps> = ({
  showGroup = true,
  collapsed = false,
}) => {
  const { t, i18n } = useTranslation();

  const { teamId } = useVinesTeam();

  const navigate = useNavigate();

  const { data: oem, isLoading: isOemLoading } = useSystemConfig();

  const themeMode = get(oem, 'theme.themeMode', 'border') as ISystemConfig['theme']['themeMode'];

  const workbenchSidebarApart = get(oem, 'theme.workbenchSidebarApart', false) as boolean;

  const workbenchSidebarFormViewEmbed = get(oem, 'theme.workbenchSidebarFormViewEmbed', false) as boolean;

  const newTabOpenBoard = get(oem, 'theme.designProjects.newTabOpenBoard', true) as boolean;

  const density = oem?.theme.density ?? 'default';

  const workbenchSidebarDefaultOpen = oem?.theme.workbenchSidebarDefaultOpen ?? true;

  const extraWorkbenchPages = get(oem, ['theme', 'workbench', 'pages'], []) as IPinPage[];
  const extraWorkbenchPageGroups = get(oem, ['theme', 'workbench', 'pageGroups'], []) as IPageGroup[];

  const { data, isLoading, mutate } = useWorkspacePages();

  const { trigger: updateGroupSortTrigger } = useUpdateGroupSort();

  const setWorkbenchCacheVal = useSetWorkbenchCacheVal();

  const [{ activePageFromWorkflowDisplayName, activePageFromWorkflowInstanceId, activePageFromType, extraMetadata }] =
    useUrlState<{
      activePageFromWorkflowDisplayName?: string;
      activePageFromWorkflowInstanceId?: string;
      activePageFromType?: string;
      extraMetadata?: string;
    }>({});

  const { data: workflowExecution } = useWorkflowExecutionSimple(activePageFromWorkflowInstanceId);

  const [groupId, setGroupId] = useState<string>('default');
  const [pageId, setPageId] = useState<string>('');
  const [visionProAlertVisible, setVisionProAlertVisible] = useState(false);
  // const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const originalPages: IPinPage[] = useMemo(() => {
    const pages = [...(data?.pages ?? [])];

    pages.unshift(...extraWorkbenchPages);
    if (!pages.some((page) => page.id === 'global-design-board') && !isOemLoading && newTabOpenBoard) {
      pages.unshift(GLOBAL_DESIGN_BOARD_PAGE);
    }

    return pages;
  }, [data?.pages, isOemLoading, newTabOpenBoard]);
  const originalGroups = useMemo(() => {
    return [
      GLOBAL_DESIGN_BOARD_PAGE_GROUP,
      ...extraWorkbenchPageGroups,
      ...(data?.groups
        ?.map((group) => ({
          ...group,
          pageIds: group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId)),
        }))
        ?.filter((group) => group.pageIds.length) ?? []),
    ];
    // data?.groups
    //   ?.map((group) => ({
    //     ...group,
    //     pageIds: group.isBuiltIn
    //       ? ['global-design-board', ...group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId))]
    //       : group.pageIds.filter((pageId) => originalPages.some((it) => it.id === pageId)),
    //   }))
    //   ?.filter((group) => group.pageIds.length) ?? []
  }, [data?.groups, originalPages, data, extraWorkbenchPageGroups, extraWorkbenchPages]);

  const { trigger: updateGroupPageSortTrigger } = useUpdateGroupPageSort(groupId);

  const pagesMap = keyBy(originalPages, 'id');
  // const groupMap = new Map(originalGroups.map((item, index) => [item.id, index]));
  const lists = pageGroupProcess(originalGroups, pagesMap);

  const [{ activePage }] = useUrlState<{ activePage: string }>({ activePage: '' });
  const toggleToActivePageRef = useRef(activePage || workflowExecution ? false : null);

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

    if (workflowExecution) {
      const targetPage = latestOriginalPages.current.find((it) => it.workflowId === workflowExecution.workflowId);
      if (targetPage) {
        const targetInput = {};

        for (const { data, id } of workflowExecution.input) {
          targetInput[id] = data;
        }

        setWorkbenchCacheVal(workflowExecution.workflowId, targetInput);

        setPageId(targetPage.id);
        setCurrentPage({ [teamId]: targetPage });

        return;
      }
    }

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
      const groupWithPageId = latestOriginalGroups.current.find((it) => it.pageIds.includes(targetPage?.id ?? ''));
      if (targetPage && groupWithPageId) {
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
  }, [
    currentPage?.[teamId],
    data,
    teamId,
    activePageFromWorkflowDisplayName,
    activePageFromType,
    workflowExecution,
    activePageFromWorkflowInstanceId,
  ]);

  const { ref: wrapperRef, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState<number | string>(500);
  const globalViewSize = useGlobalViewSize();

  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      const calcHeight =
        globalViewSize != 'sm'
          ? `calc(${wrapperHeight}px - var(--global-spacing) * 2 - 3.5rem - 0.5rem)`
          : `calc(${wrapperHeight}px - 2.5rem - 2px)`;
      setHeight(calcHeight);
    },
    [wrapperHeight, globalViewSize],
    { wait: 64 },
  );

  const toggleOnlyShowWorkbenchIcon = useToggleOnlyShowWorkbenchIcon();
  const setOnlyShowWorkbenchIcon = useSetOnlyShowWorkbenchIcon();

  useEffect(() => {
    if (activePageFromWorkflowDisplayName) {
      setOnlyShowWorkbenchIcon(true);
      return;
    }
    setOnlyShowWorkbenchIcon(!workbenchSidebarDefaultOpen);
  }, [workbenchSidebarDefaultOpen, activePageFromWorkflowDisplayName]);

  const hasGroups = lists.length && !isLoading;
  const onlyShowWorkbenchIcon = useOnlyShowWorkbenchIcon();
  const onPageClick = useCallback(
    (page: IWorkbenchViewItemPage) => {
      const pageName = getI18nContent(page.displayName) ?? '';
      const visionProWorkflows = oem?.theme?.visionProWorkflows ?? [];

      // 检查是否在 Vision Pro 工作流列表中
      if (visionProWorkflows.includes(pageName)) {
        setVisionProAlertVisible(true);
        return;
      }

      startTransition(() => {
        navigate({
          search: {
            extraMetadata,
          },
        });
        setCurrentPage({ [teamId]: { ...page, groupId } });
      });
    },
    [teamId, groupId, setCurrentPage, oem],
  );

  useEffect(() => {
    if (globalViewSize === 'sm') {
      setOnlyShowWorkbenchIcon(true);
    }
  }, [globalViewSize]);

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

  const event$ = useEventEmitter();

  const showFormEmbed =
    workbenchSidebarFormViewEmbed &&
    EMBED_TYPE_LIST.includes(currentPage?.[teamId]?.type ?? '') &&
    currentPage?.[teamId]?.workflowId;

  const setEmbedSidebar = useSetEmbedSidebar();

  useEffect(() => {
    setEmbedSidebar(showFormEmbed);
  }, [showFormEmbed]);

  const tabularTheme = get(
    oem,
    'theme.views.form.tabular.theme',
    'default',
  ) as CustomizationFormView['tabular']['theme'];

  return (
    <div
      className={cn(
        `flex h-full items-center justify-center`,
        workbenchSidebarApart ? 'gap-global-1/2' : 'rounded-lg bg-slate-1',
        !workbenchSidebarApart && themeMode === 'border' && 'border border-input',
        !workbenchSidebarApart && themeMode === 'shadow' && 'shadow-around',
      )}
      ref={wrapperRef}
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
                  className={cn(
                    'flex h-full justify-between bg-slate-1',
                    workbenchSidebarApart ? 'rounded-lg' : 'rounded-l-lg',
                  )}
                >
                  <VirtuaWorkbenchViewGroupList
                    data={lists}
                    groupId={groupId}
                    setGroupId={setGroupId}
                    onReorder={onPageGroupReorder}
                  />
                </div>
              </>
            ) : null
          ) : (
            <div className="vines-center absolute flex-col gap-global">
              <CircleSlash size={64} />
              <div className="flex flex-col text-center">
                <h2 className="font-bold">{t('workbench.view.no-starred-view')}</h2>
              </div>
            </div>
          )}
          <div
            className={cn(
              'h-full bg-slate-1 [&_h1]:line-clamp-1 [&_span]:line-clamp-1',
              showFormEmbed ? 'flex' : 'grid grid-rows-[1fr_auto]',
              workbenchSidebarApart ? 'rounded-lg' : 'rounded-r-lg',
            )}
          >
            {/* Second nav */}
            <VirtuaWorkbenchViewList
              height={height}
              data={(lists?.find((it) => it.id === groupId)?.pages ?? []) as IPinPage[]}
              currentPageId={currentPage?.[teamId]?.id}
              currentGroupId={groupId}
              onChildClick={onPageClick}
              onReorder={onPageGroupPageReorder}
            />
            {showFormEmbed ? (
              <>
                <Separator orientation="vertical" />
                {currentPage?.[teamId]?.type === 'preview' && (
                  <VinesFlowProvider
                    key={currentPage?.[teamId]?.workflowId}
                    workflowId={currentPage?.[teamId]?.workflowId}
                  >
                    <FlowStoreProvider key={currentPage?.[teamId]?.workflowId} createStore={createFlowStore}>
                      <CanvasStoreProvider key={currentPage?.[teamId]?.workflowId} createStore={createCanvasStore}>
                        <VinesViewWrapper
                          key={currentPage?.[teamId]?.workflowId}
                          workflowId={currentPage?.[teamId]?.workflowId}
                        >
                          <ExecutionStoreProvider
                            key={currentPage?.[teamId]?.workflowId}
                            createStore={createExecutionStore}
                          >
                            <WorkbenchSidebarNormalModeEmbedContent
                              displayName={currentPage?.[teamId]?.workflow?.displayName}
                            >
                              <VinesTabular theme={tabularTheme} isMiniFrame={false} event$={event$} height={height} />
                            </WorkbenchSidebarNormalModeEmbedContent>
                          </ExecutionStoreProvider>
                        </VinesViewWrapper>
                      </CanvasStoreProvider>
                    </FlowStoreProvider>
                  </VinesFlowProvider>
                )}
                {currentPage?.[teamId]?.type === 'global-design-board' && (
                  <DesignBoardProvider createStore={getGlobalDesignBoardStore}>
                    <WorkbenchSidebarNormalModeEmbedContent displayName={currentPage?.[teamId]?.displayName}>
                      <div className="h-full p-global pt-0">
                        <GlobalDesignBoardOperationBarArea />
                      </div>
                    </WorkbenchSidebarNormalModeEmbedContent>
                  </DesignBoardProvider>
                )}
              </>
            ) : (
              <div
                className={cn(
                  'flex items-center justify-center gap-global pb-global pt-2',
                  density === 'compact' && 'px-global-1/2',
                  density === 'default' && 'px-global',
                )}
              >
                {globalViewSize !== 'sm' && (
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
                )}
              </div>
            )}
          </div>
        </WorkbenchViewItemCurrentData.Provider>
      )}
      <AlertDialog open={visionProAlertVisible} onOpenChange={setVisionProAlertVisible}>
        <AlertDialogContent
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.utils.tips')}</AlertDialogTitle>
            <AlertDialogDescription>请在 Vision Pro 中打开使用</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setVisionProAlertVisible(false)}>
              {t('common.utils.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
