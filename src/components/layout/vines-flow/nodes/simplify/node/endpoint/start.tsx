import React from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { motion } from 'framer-motion';

import { useTriggers, useTriggerTypes } from '@/apis/workflow/trigger';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { VinesIcon } from '@/components/ui/vines-icon';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesStartNodeProps {
  isMiniNode?: boolean;
  canvasMode: CanvasStatus;
  canvasDisabled: boolean;
}

export const VinesStartNode: React.FC<IVinesStartNodeProps> = ({ isMiniNode, canvasMode, canvasDisabled }) => {
  const { vines } = useVinesFlow();
  const { apikey } = useVinesPage();

  const { data: triggerTypes, isLoading: triggerTypeLoading } = useTriggerTypes(apikey);
  const { data: triggers, isLoading: triggersLoading } = useTriggers(vines.workflowId, vines.version, apikey);

  const trigger = triggers?.find(({ enabled }) => enabled);
  const triggerType = triggerTypes?.find(({ type }) => type === trigger?.type);

  const loading = triggerTypeLoading || triggersLoading;
  const icon = '🚀';

  return (
    <div
      key="vines-workflow-start-node"
      className={cn(
        'node-item-box pointer-events-auto flex size-[80px] cursor-grab items-center justify-center border border-input bg-slate-1 p-1 dark:bg-slate-5',
        (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode ?? CanvasStatus.EDIT) || canvasDisabled) &&
          '!pointer-events-none',
        isMiniNode ? 'rounded-l-xl border-r-0 !bg-white' : 'rounded-2xl shadow-lg',
      )}
      onClick={() => VinesEvent.emit('flow-start-tool', vines.workflowId)}
      onContextMenu={() => VinesEvent.emit('flow-start-tool', vines.workflowId)}
    >
      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center rounded-2xl',
          !isMiniNode && 'size-[60px]',
        )}
      >
        {loading ? (
          <motion.div
            className="absolute flex"
            key="workflow_start_node_spin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" aria-label="Loading..." />
          </motion.div>
        ) : (
          <motion.div
            key="workflow_start_node_icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <VinesIcon src={triggerType?.icon ?? icon} size="2xl" backgroundColor="#fff" />
          </motion.div>
        )}
      </div>
    </div>
  );
};
