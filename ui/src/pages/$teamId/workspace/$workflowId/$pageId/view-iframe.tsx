import React, { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import { useDebounceEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { VinesLoading } from '@/components/ui/loading';
import { VINES_IFRAME_PAGE_TYPES } from '@/components/ui/vines-iframe/consts.ts';
import { VinesView } from '@/components/ui/vines-iframe/view';
import { VinesFlowProvider } from '@/components/ui/vines-iframe/view/vines-flow-provider.tsx';
import { usePageStore } from '@/store/usePageStore';
import { createViewStore, ViewStoreProvider } from '@/store/useViewStore';
import { getI18nContent } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const WorkspaceIFramePage: React.FC = () => {
  const { t } = useTranslation();

  const { workflow, workflowId, page, pageId } = useVinesPage();

  const pageTitle = usePageStore((s) => s.pageTitle);
  const setVinesIFrameVisible = usePageStore((s) => s.setVinesIFrameVisible);

  useEffect(() => {
    if (!workflow) return;
    const workflowName = getI18nContent(workflow.displayName);
    workflowName &&
      VinesEvent.emit(
        'vines-update-site-title',
        (pageTitle ? `${t([`workspace.wrapper.space.tabs.${pageTitle}`, pageTitle])} - ` : '') + workflowName,
      );
  }, [workflow, pageTitle]);

  const pageType = page?.type ?? '';
  const [type, setType] = useState<string | undefined>();
  useDebounceEffect(
    () => {
      if (VINES_IFRAME_PAGE_TYPES.includes(pageType)) {
        setType(pageType);
        setVinesIFrameVisible(true);
      }
    },
    [pageType],
    { wait: 80 },
  );

  return (
    <AnimatePresence>
      {type ? (
        <VinesFlowProvider workflowId={workflowId}>
          <ViewStoreProvider createStore={createViewStore}>
            <VinesView id={pageId} workflowId={workflowId} pageId={pageId} type={type} />
          </ViewStoreProvider>
        </VinesFlowProvider>
      ) : (
        <motion.div
          className="absolute left-0 top-0 z-[10000] size-full bg-slate-1"
          exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.2 } }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="vines-center relative size-full"
          >
            <VinesLoading />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Route = createFileRoute('/$teamId/workspace/$workflowId/$pageId/view-iframe')({
  component: WorkspaceIFramePage,
});
