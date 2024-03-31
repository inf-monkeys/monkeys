import React, { memo } from 'react';

import { AnInput } from '@/components/layout/view/vines-chat/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/view/vines-chat/chat-input/empty.tsx';
import { useVinesFlow } from '@/package/vines-flow';

interface IVinesChatInputProps {}

export const VinesChatInput: React.FC<IVinesChatInputProps> = memo(() => {
  const { vines } = useVinesFlow();

  const disabled = vines.executionStatus === 'RUNNING';
  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const handleExecutionWorkflow = (inputData: Record<string, any> = {}) => vines.start({ inputData });

  return (
    <div className="flex w-full items-center gap-4">
      {workflowInputLength ? (
        workflowInputLength === 1 ? (
          <AnInput inputs={workflowInput} onClick={handleExecutionWorkflow} />
        ) : (
          <></>
        )
      ) : (
        <EmptyInput disabled={disabled} onClick={handleExecutionWorkflow} />
      )}
    </div>
  );
});

VinesChatInput.displayName = 'VinesChatInput';
