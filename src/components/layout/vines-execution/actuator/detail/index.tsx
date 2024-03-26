import React, { memo } from 'react';

import { useElementSize } from '@mantine/hooks';

import { VinesActuatorDetailContent } from '@/components/layout/vines-execution/actuator/detail/content.tsx';
import { VinesActuatorDetailHeader } from '@/components/layout/vines-execution/actuator/detail/header.tsx';
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
