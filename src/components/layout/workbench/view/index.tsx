import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchPlus } from 'lucide-react';

import { useWorkspacePages } from '@/apis/pages';
import { WorkbenchViewHeader } from '@/components/layout/workbench/view/header.tsx';

interface IWorkbenchViewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const WorkbenchView: React.FC<IWorkbenchViewProps> = () => {
  const { data: pages } = useWorkspacePages();

  const hasPages = (pages?.length ?? 0) > 0;

  return (
    <div className="relative w-full flex-1 overflow-x-clip">
      <AnimatePresence>
        {hasPages ? (
          <motion.div
            key="vines-workbench-view"
            className="absolute top-0 size-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WorkbenchViewHeader />
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
