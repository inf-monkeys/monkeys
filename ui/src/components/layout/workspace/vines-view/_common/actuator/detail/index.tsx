import React, { memo } from 'react';

import { VinesActuatorDetailContent } from '@/components/layout/workspace/vines-view/_common/actuator/detail/content';
import { VinesActuatorDetailHeader } from '@/components/layout/workspace/vines-view/_common/actuator/detail/header.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { VinesNodeExecutionTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IVinesActuatorDetailProps {
  executionTask?: VinesNodeExecutionTask;
  height?: number;
}

export const VinesActuatorDetail: React.FC<IVinesActuatorDetailProps> = memo(({ executionTask, height }) => {
  const { ref, height: headerHeight } = useElementSize();

  return (
    <div className="flex h-full flex-1 flex-col gap-4">
      <VinesActuatorDetailHeader
        ref={ref}
        executionStartTime={executionTask?.startTime}
        executionEndTime={executionTask?.endTime}
        iteration={executionTask?.iteration}
      />
      <VinesActuatorDetailContent executionTask={executionTask} height={height ? height - 16 - headerHeight : 328} />
    </div>
  );
});

VinesActuatorDetail.displayName = 'VinesActuatorDetail';
