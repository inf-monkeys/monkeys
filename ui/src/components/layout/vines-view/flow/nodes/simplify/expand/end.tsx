import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface ISimplifyEndNodeExpandProps {}

export const SimplifyEndNodeExpand: React.FC<ISimplifyEndNodeExpandProps> = () => {
  const { canvasMode } = useCanvasStore();
  const visible = canvasMode === CanvasStatus.EDIT;

  return (
    <div className="absolute flex select-none flex-col gap-1">
      <h1 className="text-xl font-bold leading-6">结束</h1>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="workflow_start_expand_desc"
            initial={{ opacity: 0, marginTop: -24 }}
            animate={{ opacity: 1, marginTop: 0 }}
            exit={{ opacity: 0, marginTop: -24 }}
          >
            <span className="text-sm text-opacity-70">点击配置工作流输出</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};