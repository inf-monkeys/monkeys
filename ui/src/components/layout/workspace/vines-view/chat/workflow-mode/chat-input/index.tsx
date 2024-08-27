import React from 'react';

import { useSWRConfig } from 'swr';

import { useCreation, useMemoizedFn, useThrottleEffect } from 'ahooks';
import { isArray } from 'lodash';

import { AnInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/workspace/vines-view/chat/workflow-mode/chat-input/form.tsx';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable.tsx';
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

  setDirection?: React.Dispatch<React.SetStateAction<'horizontal' | 'vertical'>>;
}

export const VinesChatWorkflowModeInput: React.FC<IVinesChatWorkflowModeInputProps> = ({
  isSimple,
  workflowId,
  height,
  disabled,
  setInputHeight,
  setDirection,
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

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;
  const isUseTabular = useCreation(() => {
    setDirection?.(workflowInputLength > 1 ? 'horizontal' : 'vertical');

    return workflowInputLength > 1;
  }, [workflowInputLength]);

  const { ref: inputRef, height: wrapperHeight } = useElementSize();
  useThrottleEffect(
    () => {
      if (!wrapperHeight || isUseTabular) {
        setInputHeight(0);
        return;
      }
      setInputHeight(wrapperHeight + (workbenchVisible ? 0 : 6));
    },
    [wrapperHeight, isUseTabular],
    { wait: 64 },
  );

  return workflowInputLength > 1 ? (
    <>
      <ResizableHandle className="mx-4" />
      <ResizablePanel defaultSize={32} minSize={32}>
        <FormInput
          height={height}
          loading={isExecutionRunning}
          disabled={disabled}
          inputs={workflowInput}
          onClick={handleExecutionWorkflow}
        />
      </ResizablePanel>
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
