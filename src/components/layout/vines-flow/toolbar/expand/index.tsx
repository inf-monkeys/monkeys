import React from 'react';

import { VinesRunInsideToolbar } from 'src/components/layout/vines-flow/toolbar/expand/execution';

import { VinesVersionToolbar } from '@/components/layout/vines-flow/toolbar/expand/version';
import { WorkflowRelease } from '@/components/layout/vines-flow/toolbar/expand/version/release.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';

interface IVinesVersionToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesExpandToolbar: React.FC<IVinesVersionToolbarProps> = () => {
  const { isWorkflowRUNNING } = useFlowStore();

  return (
    <div className="absolute right-0 top-0 z-40 m-4 flex items-center gap-2">
      <VinesRunInsideToolbar />
      <Card className={cn('flex flex-nowrap gap-2 p-2', isWorkflowRUNNING && 'hidden')}>
        <VinesVersionToolbar />
        <WorkflowRelease />
      </Card>
    </div>
  );
};
