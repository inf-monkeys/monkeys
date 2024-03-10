import React from 'react';

import { VinesIcon } from '@/components/ui/vines-icon';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';
import { cn } from '@/utils';

interface IVinesEndNodeProps {
  isMiniNode?: boolean;
  canvasMode: CanvasStatus;
  canvasDisabled: boolean;
}

export const VinesEndNode: React.FC<IVinesEndNodeProps> = ({ isMiniNode, canvasMode, canvasDisabled }) => {
  return (
    <div
      key="vines-workflow-end-node"
      className={cn(
        'node-item-box pointer-events-auto flex size-[80px] cursor-grab items-center justify-center border border-input bg-slate-1 p-1 dark:bg-slate-5',
        (![CanvasStatus.EDIT, CanvasStatus.READONLY].includes(canvasMode ?? CanvasStatus.EDIT) || canvasDisabled) &&
          '!pointer-events-none',
        isMiniNode ? 'rounded-l-xl !bg-[#f2f2f2]' : 'rounded-2xl shadow-lg',
      )}
    >
      <VinesIcon src="🏁" size="2xl" backgroundColor="#fff" />
    </div>
  );
};
