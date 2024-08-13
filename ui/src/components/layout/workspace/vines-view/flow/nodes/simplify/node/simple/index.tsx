import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesLoading } from '@/components/ui/loading';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesNode } from '@/package/vines-flow/core/nodes';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';

interface IVinesSimpleNodeProps {
  node: VinesNode;
  canvasMode?: CanvasStatus;
  canvasDisabled?: boolean;
  isMiniNode?: boolean;
  isOverlay?: boolean;
}

export const VinesSimpleNode: React.FC<IVinesSimpleNodeProps> = ({
  node,
  isMiniNode,
  canvasMode,
  canvasDisabled,
  ...props
}) => {
  const {
    id: nodeId,
    _task: { name: toolName },
    customData,
  } = node;

  const { vines } = useVinesFlow();

  const icon = customData?.icon || vines.getTool(toolName)?.icon || 'emoji:⚠️:#35363b';
  const loading = vines.status === 'idle';

  return (
    <AnimatePresence>
      <motion.div
        key={nodeId + '_node'}
        data-id={nodeId}
        className={cn(
          'node-item-box pointer-events-auto flex size-[80px] cursor-grab items-center justify-center border border-input bg-slate-1 p-1 dark:bg-slate-5',
          (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode ?? CanvasStatus.EDIT) || canvasDisabled) &&
            '!pointer-events-none',
          isMiniNode ? 'rounded-l-xl border-r-0 !bg-white dark:!bg-slate-3' : 'rounded-2xl shadow-lg',
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        {...props}
      >
        <div
          className={cn(
            'relative flex h-full w-full items-center justify-center rounded-2xl',
            loading && 'animate-pulse',
            !isMiniNode && 'size-[60px]',
          )}
        >
          {loading ? (
            <motion.div
              className="absolute flex"
              key={nodeId + '_node_spin'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VinesLoading />
            </motion.div>
          ) : (
            <motion.div
              key={nodeId + '_node_icon'}
              className="rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VinesIcon src={icon} size="2xl" backgroundColor="#fff" disabledPreview />
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
