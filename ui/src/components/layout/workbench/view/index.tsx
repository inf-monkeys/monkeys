import React, { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { WorkbenchViewHeader } from '@/components/layout/workbench/view/header.tsx';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';

interface IWorkbenchViewProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
}

export const WorkbenchView: React.FC<IWorkbenchViewProps> = ({ groupId }) => {
  const { t } = useTranslation();

  const { data } = useWorkspacePages();
  const pages = data?.pages;

  const { ref, width, height } = useElementSize();

  const [page] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const hasPages = (pages?.length ?? 0) > 0;
  const hasPage = !!(page?.id && page?.teamId && page?.workflowId && page?.type);

  const { setContainerWidth, setContainerHeight } = usePageStore();
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height - 52);
  }, [width, height]);

  return (
    <div ref={ref} className="relative w-full flex-1 overflow-hidden">
      <AnimatePresence>
        {hasPages && hasPage ? (
          <motion.div
            key="vines-workbench-view"
            className="absolute top-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <WorkbenchViewHeader page={page} groupId={groupId} />
            <div className="relative size-full max-h-[calc(100%-4.3rem)] overflow-hidden rounded-lg">
              <VinesIFrame pages={pages ?? []} page={page} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vines-workbench-view-empty"
            className="vines-center absolute top-0 size-full flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5 } }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GitBranchPlus size={64} />
            <div className="flex flex-col text-center">
              <h2 className="font-bold">{t('workbench.view.no-starred-view')}</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
