import React from 'react';

import { useSWRConfig } from 'swr';

import { useMemoizedFn, useThrottleEffect } from 'ahooks';
import { isArray } from 'lodash';

import { AnInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/form.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { usePageStore } from '@/store/usePageStore';

interface IVinesChatWorkflowModeInputProps {
  isSimple: boolean;
  workflowId: string;
  height: number;
  disabled: boolean;
  setInputHeight: React.Dispatch<React.SetStateAction<number>>;
}

export const VinesChatWorkflowModeInput: React.FC<IVinesChatWorkflowModeInputProps> = ({
  isSimple,
  workflowId,
  height,
  disabled,
  setInputHeight,
}) => {
  const { mutate } = useSWRConfig();

  const { vines } = useVinesFlow();

  const isExecutionStatus = vines.executionStatus();
  const isExecutionPaused = isExecutionStatus === 'PAUSED';
  const isExecutionRunning = isSimple ? false : isExecutionStatus === 'RUNNING' || isExecutionPaused;

  const [sessions] = useLocalStorage<Record<string, string>>('vines-ui-chat-session', {});

  const handleExecutionWorkflow = useMemoizedFn((inputData: Record<string, any> = {}) => {
    vines.start({ inputData, chatSessionId: sessions[workflowId], onlyStart: isSimple });
    vines.emit('refresh');

    setTimeout(() => void mutate((key) => isArray(key) && key?.[0] === '/api/workflow/executions/search'), 1000);
  });

  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const { ref: inputRef, height: wrapperHeight } = useElementSize();
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setInputHeight(wrapperHeight - (workbenchVisible ? 28 : 58));
    },
    [wrapperHeight],
    { wait: 64 },
  );

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  return workflowInputLength > 1 ? (
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
    <div ref={inputRef}>
      {workflowInputLength ? (
        <AnInput
          loading={isExecutionRunning}
          disabled={disabled}
          inputs={workflowInput}
          onClick={handleExecutionWorkflow}
        />
      ) : (
        <EmptyInput loading={isExecutionRunning} disabled={disabled} onClick={handleExecutionWorkflow} />
      )}
    </div>
  );
};
