import React from 'react';

import { VinesExecutionHistory } from '@/components/layout/vines-execution/history';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';

export const VinesPreView: React.FC = () => {
  const { vines } = useVinesFlow();

  const hasExecution = vines.executionWorkflowExecution !== null;
  const isExecutionStatus = vines.executionStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const hasWorkflowVariables = vines.workflowInput.length > 0;

  return (
    <div className="space-y-6 p-10">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">预览工作流</h2>
        <p className="text-muted-foreground">
          {`${hasWorkflowVariables ? '填写表单' : '直接'}运行工作流或查看历史运行记录`}
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-row space-x-12 space-y-0">
        <aside className="w-3/5"></aside>
        <div className="flex-1">
          <VinesExecutionHistory />
        </div>
      </div>
    </div>
  );
};
