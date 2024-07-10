/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect } from 'react';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';
import z from 'zod';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { VINES_IFRAME_PAGE_IDS, VINES_VIEW_ID_MAPPER } from '@/components/ui/vines-iframe/consts.ts';
import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider.tsx';
import { usePageStore } from '@/store/usePageStore';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const WorkspacePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { workflow, workflowId, pages, page, pageId, teamId, setPage } = useVinesPage();

  const { pageTitle } = usePageStore();

  useEffect(() => {
    if (!workflow) return;
    const workflowName = getI18nContent(workflow.displayName);
    workflowName &&
      VinesEvent.emit(
        'vines-update-site-title',
        (pageTitle ? `${t([`workspace.wrapper.space.tabs.${pageTitle}`, pageTitle])} - ` : '') + workflowName,
      );
  }, [workflow, pageTitle]);

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

  useEffect(() => {
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
  }, [pageId, pages]);

  return <VinesIFrame pages={pages ?? []} page={page} />;
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/')({
  component: WorkspacePage,
  validateSearch: z.object({
    to: z.string().optional(),
  }),
});
