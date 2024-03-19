import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { ToolOutput } from '@/components/layout/vines-flow/headless-modal/tool-editor/config/tool-output';

interface IComplicateSimpleNodeExpandProps {
  nodeId: string;
  visible: boolean;
}

export const ComplicateSimpleNodeExpand: React.FC<IComplicateSimpleNodeExpandProps> = ({ nodeId, visible }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="vines-complicate-simple-node-expand"
          className="absolute inset-0 left-[25.5rem] top-0 z-50 h-full w-80 rounded-lg border bg-card text-card-foreground shadow-sm"
          initial={{ opacity: 0, marginLeft: -45, scale: 0.95 }}
          animate={{ opacity: 1, marginLeft: 0, scale: 1 }}
          exit={{ opacity: 0, marginLeft: -45, scale: 0.95 }}
        >
          <div className="flex flex-1 flex-col overflow-y-auto p-5">
            <h1 className="line-clamp-1 text-base font-bold">输出</h1>
            <div className="h-[calc(100%-1.5rem)]">
              <ToolOutput nodeId={nodeId} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
