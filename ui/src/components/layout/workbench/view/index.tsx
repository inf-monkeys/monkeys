import React, { useEffect } from 'react';

import { useElementSize } from '@mantine/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchPlus } from 'lucide-react';

import { useWorkspacePages } from '@/apis/pages';
import { IPinPage } from '@/apis/pages/typings.ts';
import { WorkbenchViewHeader } from '@/components/layout/workbench/view/header.tsx';
import { VinesIFrame } from '@/components/ui/vines-iframe';
import { usePageStore } from '@/store/usePageStore';
import { useLocalStorage } from '@/utils';

interface IWorkbenchViewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchView: React.FC<IWorkbenchViewProps> = () => {
  const { data: pages } = useWorkspacePages();

  const { ref, width, height } = useElementSize();

  const [page, setPage] = useLocalStorage<Partial<IPinPage>>('vines-ui-workbench-page', {});

  const hasPages = (pages?.length ?? 0) > 0;
  const hasPage = !!(page?.id && page?.teamId && page?.workflowId && page?.type);

  useEffect(() => {
    if (!hasPage && pages?.length) {
      setPage(pages[0]);
    }
  }, [hasPage]);

  const { setContainerWidth, setContainerHeight } = usePageStore();
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
  }, [width, height]);

  return (
    <div ref={ref} className="relative w-full flex-1 overflow-x-clip">
      <AnimatePresence>
        {hasPages && hasPage ? (
          <motion.div
            key="vines-workbench-view"
            className="absolute top-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorkbenchViewHeader page={page} />
            <div className="relative h-[calc(100%-3.2rem)] w-full overflow-hidden rounded-r-lg">
              <VinesIFrame pages={pages ?? []} page={page} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="vines-workbench-view-empty"
            className="vines-center absolute top-0 size-full flex-col gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GitBranchPlus size={64} />
            <div className="flex flex-col text-center">
              <h2 className="font-bold">暂无标星视图</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
