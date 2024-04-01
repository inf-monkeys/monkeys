import React from 'react';

import { VinesRunInsideToolbar } from 'src/components/layout/vines-flow/toolbar/expand/execution';

import { VinesExpandToolErrors } from '@/components/layout/vines-flow/toolbar/expand/errors';
import { VinesVersionToolbar } from '@/components/layout/vines-flow/toolbar/expand/version';
import { WorkflowRelease } from '@/components/layout/vines-flow/toolbar/expand/version/release.tsx';
import { Card } from '@/components/ui/card.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { IVinesFlowRenderType } from '@/package/vines-flow/core/typings.ts';
import { useCanvasStore } from '@/store/useCanvasStore';
import { cn } from '@/utils';

interface IVinesVersionToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesExpandToolbar: React.FC<IVinesVersionToolbarProps> = () => {
  const { isWorkflowRUNNING } = useCanvasStore();

  const { vines } = useVinesFlow();
  const vinesVersion = vines.version;

  const handleVersionChange = (version: number) => {
    vines.update({ version });
  };

  const enableExecutionInside = vines.renderOptions.type === IVinesFlowRenderType.COMPLICATE;

  return (
    <div className="absolute right-0 top-0 z-40 m-4 flex items-center gap-2">
      {enableExecutionInside && <VinesRunInsideToolbar />}
      <Card className={cn('flex flex-nowrap gap-2 p-2', isWorkflowRUNNING && 'hidden')}>
        <VinesVersionToolbar version={vinesVersion} onVersionChange={handleVersionChange} />
        <WorkflowRelease version={vinesVersion} onVersionChange={handleVersionChange} />
      </Card>
      <VinesExpandToolErrors disabled={isWorkflowRUNNING} />
    </div>
  );
};
