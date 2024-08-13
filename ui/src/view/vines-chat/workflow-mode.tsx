import React from 'react';

import { useSWRConfig } from 'swr';

import { isArray } from 'lodash';

import { AnInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/form.tsx';
import { VinesChatList } from '@/components/layout/workspace/vines-view/chat/workflow-mode/messages';
import { Separator } from '@/components/ui/separator.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';

interface IVinesWorkflowModeProps {
  height: number;
  disabled?: boolean;
}

export const VinesWorkflowMode: React.FC<IVinesWorkflowModeProps> = ({ height, disabled = false }) => {
  const { mutate } = useSWRConfig();

  const visible = useViewStore((s) => s.visible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const { vines } = useVinesFlow();

  const isExecutionStatus = vines.executionStatus;
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const [sessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const handleExecutionWorkflow = (inputData: Record<string, any> = {}) => {
    vines.start({ inputData, chatSessionId: sessions[workflowId] });
    vines.executionStatus = 'RUNNING';
    vines.emit('refresh');

    setTimeout(() => void mutate((key) => isArray(key) && key?.[0] === '/api/workflow/executions/search'), 1000);
  };

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
            <FormInput
              height={height}
              loading={isExecutionRunning}
              disabled={disabled}
              inputs={workflowInput}
              onClick={handleExecutionWorkflow}
            />
          </>
        ) : (
          <AnInput
            loading={isExecutionRunning}
            disabled={disabled}
            inputs={workflowInput}
            onClick={handleExecutionWorkflow}
          />
        )
      ) : (
        <EmptyInput loading={isExecutionRunning} disabled={disabled} onClick={handleExecutionWorkflow} />
      )}
    </>
  );
};
