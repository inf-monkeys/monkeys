import React from 'react';

import { useElementSize } from '@mantine/hooks';

import { AnInput } from '@/components/layout/view/vines-chat/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/view/vines-chat/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/view/vines-chat/chat-input/form.tsx';
import { VinesChatList } from '@/components/layout/view/vines-chat/list';
import { ChatSidebar } from '@/components/layout/view/vines-chat/sidebar';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesChatView: React.FC = () => {
  const { ref, height } = useElementSize();

  const { workflowId } = useVinesPage();
  const { visible } = useViewStore();

  const { vines } = useVinesFlow();

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  const disabled = vines.executionStatus === 'RUNNING';

  const handleExecutionWorkflow = (inputData: Record<string, any> = {}) => vines.start({ inputData });

  const finalHeight = height - 68;

  return (
    <div ref={ref} className="flex size-full p-10">
      <ChatSidebar />
      <div className={cn('flex flex-1 flex-col gap-4 overflow-clip p-4 pb-0', hasMoreThanOneInput && 'flex-row')}>
        <div className="size-full flex-1">
          <VinesChatList visible={visible} workflowId={workflowId} />
        </div>
        {workflowInputLength ? (
          hasMoreThanOneInput ? (
            <>
              <Separator orientation="vertical" />
              <FormInput
                height={finalHeight}
                disabled={disabled}
                inputs={workflowInput}
                onClick={handleExecutionWorkflow}
              />
            </>
          ) : (
            <AnInput inputs={workflowInput} onClick={handleExecutionWorkflow} />
          )
        ) : (
          <EmptyInput disabled={disabled} onClick={handleExecutionWorkflow} />
        )}
      </div>
    </div>
  );
};
