import React from 'react';

import { VinesRunInsideToolbar } from '@/components/layout/vines-flow/toolbar/expand/run-inside';
import { VinesVersionToolbar } from '@/components/layout/vines-flow/toolbar/expand/version';
import { WorkflowRelease } from '@/components/layout/vines-flow/toolbar/expand/version/release.tsx';
import { Card } from '@/components/ui/card.tsx';

interface IVinesVersionToolbarProps extends React.ComponentPropsWithoutRef<'div'> {}

export const VinesExpandToolbar: React.FC<IVinesVersionToolbarProps> = () => {
  return (
    <div className="absolute right-0 top-0 z-40 m-4 flex items-center gap-2">
      <VinesRunInsideToolbar />
      <Card className="flex flex-nowrap gap-2 p-2">
        <VinesVersionToolbar />
        <WorkflowRelease />
      </Card>
    </div>
  );
};
