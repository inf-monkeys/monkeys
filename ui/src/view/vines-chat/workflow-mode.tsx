import React, { useState } from 'react';

import { VinesChatList } from '@/components/layout/workspace/vines-view/chat/workflow-mode';
import { VinesChatWorkflowModeInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable.tsx';
import { useFlowStore } from '@/store/useFlowStore';

interface IVinesWorkflowModeProps {
  height: number;
  disabled?: boolean;
}

export const VinesWorkflowMode: React.FC<IVinesWorkflowModeProps> = ({ height, disabled = false }) => {
  const { page } = useVinesPage();
  const isSimple = !(page?.customOptions?.showExecutionProcess ?? false);

  const workflowId = useFlowStore((s) => s.workflowId);

  const [inputHeight, setInputHeight] = useState(0);

  return (
    <>
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={75} minSize={50}>
          <VinesChatList workflowId={workflowId} useSimple={isSimple} height={height - inputHeight} />
        </ResizablePanel>
        <VinesChatWorkflowModeInput
          workflowId={workflowId}
          height={height}
          setInputHeight={setInputHeight}
          isSimple={isSimple}
          disabled={disabled}
        />
      </ResizablePanelGroup>
    </>
  );
};
