import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { useTriggers, useTriggerTypes } from '@/apis/workflow/trigger';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface ISimplifyStartNodeExpandProps {}

export const SimplifyStartNodeExpand: React.FC<ISimplifyStartNodeExpandProps> = () => {
  const { vines } = useVinesFlow();

  const { data: triggerTypes } = useTriggerTypes();
  const { data: triggers } = useTriggers(vines.workflowId, vines.version);

  const { canvasMode } = useCanvasStore();
  const visible = canvasMode === CanvasStatus.EDIT;

  const trigger = triggers?.find(({ enabled }) => enabled);
  const triggerType = triggerTypes?.find(({ type }) => type === trigger?.type);

  return (
    <div className="absolute flex select-none flex-col gap-1">
      <h1 className="text-xl font-bold leading-6">{triggerType?.displayName ?? '开始'}</h1>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="workflow_start_expand_desc"
            initial={{ opacity: 0, marginTop: -24 }}
            animate={{ opacity: 1, marginTop: 0 }}
            exit={{ opacity: 0, marginTop: -24 }}
          >
            <span className="text-sm text-opacity-70">{triggerType?.description ?? '点击配置工作流输入和触发器'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
