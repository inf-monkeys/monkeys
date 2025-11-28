/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect } from 'react';

import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { VINES_IFRAME_PAGE_IDS, VINES_IFRAME_PAGE_TYPES, VINES_VIEW_ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider';
import { usePageStore } from '@/store/usePageStore';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const WorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { workflow, workflowId, pages, page, pageId, teamId, setPage } = useVinesPage();

  const pageTitle = usePageStore((s) => s.pageTitle);

  // 统一在组件顶部声明所有 hooks，避免在条件分支中出现「本次渲染少调了某个 hook」的问题
  useEffect(() => {
    if (!workflow) return;
    const workflowName = getI18nContent(workflow.displayName);
    workflowName &&
      VinesEvent.emit(
        'vines-update-site-title',
        (pageTitle ? `${t([`workspace.wrapper.space.tabs.${pageTitle}`, pageTitle])} - ` : '') + workflowName,
      );
  }, [workflow, pageTitle]);

  useEffect(() => {
    // 对于内置应用的虚拟 pinned 视图（builtin- 开头），不做 pageId 校验和重定向
    if ((pageId ?? '').startsWith('builtin-')) return;

    if (pages && pageId && teamId) {
      // 二次检查 pageId
      const page = pages.find(({ id }) => id === pageId);
      if (page) {
        setPage(page);
      } else {
        void navigate({
          to: '/$teamId/workflows',
          params: {
            teamId,
          },
        });
      }
    }
  }, [pageId, pages, teamId, navigate, setPage]);

  // 1. 内置应用 pinned 视图（builtin-<workflowId>-<type>），不依赖后端 pageId，直接渲染对应视图
  if ((pageId ?? '').startsWith('builtin-')) {
    const segments = (pageId ?? '').split('-');
    const builtinType = segments[segments.length - 1] as string;
    const type = (VINES_IFRAME_PAGE_TYPES.includes(builtinType) ? builtinType : 'preview') as string;

    return (
      <VinesFlowProvider workflowId={workflowId}>
        <ViewStoreProvider createStore={createViewStore}>
          <VinesView id={pageId} workflowId={workflowId} pageId={pageId} type={type} />
        </ViewStoreProvider>
      </VinesFlowProvider>
    );
  }

  if (VINES_IFRAME_PAGE_IDS.includes(pageId)) {
    const type = VINES_VIEW_ID_MAPPER[pageId] || pageId;

    return (
      <VinesFlowProvider workflowId={workflowId}>
        <ViewStoreProvider createStore={createViewStore}>
          <VinesView id={pageId} workflowId={workflowId} pageId={pageId} type={type} />
        </ViewStoreProvider>
      </VinesFlowProvider>
    );
  }

  return <VinesIFrame pages={pages ?? []} page={page} />;
};

export const Route = createLazyFileRoute('/$teamId/workspace/$workflowId/$pageId/')({
  component: WorkspacePage,
});
