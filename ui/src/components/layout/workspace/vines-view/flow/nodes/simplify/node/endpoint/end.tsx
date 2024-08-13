import React from 'react';

import { VinesIcon } from '@/components/ui/vines-icon';
import { useFlowStore } from '@/store/useFlowStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IVinesEndNodeProps {
  isMiniNode?: boolean;
  canvasMode: CanvasStatus;
  canvasDisabled: boolean;
}

export const VinesEndNode: React.FC<IVinesEndNodeProps> = ({ isMiniNode, canvasMode, canvasDisabled }) => {
  const workflowId = useFlowStore((s) => s.workflowId);

  return (
    <div
      key="vines-workflow-end-node"
      className={cn(
        'node-item-box pointer-events-auto flex size-[80px] cursor-grab items-center justify-center border border-input bg-slate-1 p-1 dark:bg-slate-5',
        (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode ?? CanvasStatus.EDIT) || canvasDisabled) &&
          '!pointer-events-none',
        isMiniNode ? 'rounded-l-xl border-r-0 !bg-white dark:!bg-slate-3' : 'rounded-2xl shadow-lg',
      )}
      onClick={() => VinesEvent.emit('flow-end-tool', workflowId)}
      onContextMenu={() => VinesEvent.emit('flow-end-tool', workflowId)}
    >
      <VinesIcon src="🏁" size="2xl" backgroundColor="#fff" disabledPreview />
    </div>
  );
};
