import React from 'react';

import { AnInput } from '@/components/layout/vines-view/chat/workflow-mode/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/vines-view/chat/workflow-mode/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/vines-view/chat/workflow-mode/chat-input/form.tsx';
import { VinesChatList } from '@/components/layout/vines-view/chat/workflow-mode/messages';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';

interface IVinesWorkflowModeProps {
  height: number;
  disabled?: boolean;
}

export const VinesWorkflowMode: React.FC<IVinesWorkflowModeProps> = ({ height, disabled = false }) => {
  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { vines } = useVinesFlow();

  const handleExecutionWorkflow = (inputData: Record<string, any> = {}) => vines.start({ inputData });

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  return (
    <>
      <div className="size-full flex-1">
        <VinesChatList visible={visible} workflowId={workflowId} />
      </div>
      {workflowInputLength ? (
        hasMoreThanOneInput ? (
          <>
            <Separator orientation="vertical" />
            <FormInput height={height} disabled={disabled} inputs={workflowInput} onClick={handleExecutionWorkflow} />
          </>
        ) : (
          <AnInput disabled={disabled} inputs={workflowInput} onClick={handleExecutionWorkflow} />
        )
      ) : (
        <EmptyInput disabled={disabled} onClick={handleExecutionWorkflow} />
      )}
    </>
  );
};
