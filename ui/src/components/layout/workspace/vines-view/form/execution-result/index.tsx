import React from 'react';

import { type EventEmitter } from 'ahooks/lib/useEventEmitter';

import { MasonryExecutionResultGrid } from '@/components/layout/workspace/vines-view/form/execution-result/execution-result.tsx';
import { Card, CardContent } from '@/components/ui/card.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

interface IVinesExecutionResultProps extends React.ComponentPropsWithoutRef<'div'> {
  event$: EventEmitter<void>;
  height: number;

  enablePostMessage?: boolean;
  isMiniFrame?: boolean;
}

export const LOAD_LIMIT = 22;

export const VinesExecutionResult: React.FC<IVinesExecutionResultProps> = ({
  className,
  event$,
  height,
  enablePostMessage,
  isMiniFrame,
}) => {
  const visible = useViewStore((s) => s.visible);
  const storeWorkflowId = useFlowStore((s) => s.workflowId);
  const workflowId = storeWorkflowId && visible ? storeWorkflowId : null;

  const forceUpdate = useForceUpdate();
  event$.useSubscription(() => forceUpdate());
  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-0">
        <MasonryExecutionResultGrid workflowId={workflowId} enablePostMessage={enablePostMessage} height={height} />
      </CardContent>
    </Card>
  );
};
