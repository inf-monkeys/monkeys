import React, { useState } from 'react';

import { useMemoizedFn } from 'ahooks';

import { ToolDebugExecution } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/debug/execution';
import { ToolDebugHistory } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/debug/history';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { VinesTask } from '@/package/vines-flow/core/nodes/typings.ts';

interface IToolDebugProps {
  workflowId: string;
  task?: VinesTask;
}

export const ToolDebug: React.FC<IToolDebugProps> = ({ workflowId, task }) => {
  const [activeExecutionId, setActiveExecutionId] = useState<string>('');

  const [height, setHeight] = useState(0);
  const containerRef = useMemoizedFn((node: HTMLDivElement) => {
    if (node) {
      const rect = node.getBoundingClientRect();
      setHeight(rect.height);
    }
  });

  return (
    <div ref={containerRef} className="size-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={70} minSize={60}>
          <ToolDebugExecution
            height={height}
            task={task}
            activeExecutionId={activeExecutionId}
            setActiveExecutionId={setActiveExecutionId}
          />
        </ResizablePanel>
        <ResizableHandle className="mx-3" />
        <ResizablePanel defaultSize={30} minSize={25}>
          <ToolDebugHistory
            height={height}
            workflowId={workflowId}
            activeExecutionId={activeExecutionId}
            setActiveExecutionId={setActiveExecutionId}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
