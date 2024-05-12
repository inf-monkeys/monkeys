import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { ChatSidebar } from 'src/components/layout/vines-view/chat/sidebar';

import { AnInput } from '@/components/layout/vines-view/chat/chat-input/an-input.tsx';
import { EmptyInput } from '@/components/layout/vines-view/chat/chat-input/empty.tsx';
import { FormInput } from '@/components/layout/vines-view/chat/chat-input/form.tsx';
import { VinesChatList } from '@/components/layout/vines-view/chat/messages';
import { OpenAIChat } from '@/components/layout/vines-view/chat/openai';
import { Separator } from '@/components/ui/separator.tsx';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';

export const VinesChatView: React.FC = () => {
  const { ref, height } = useElementSize();

  const { workflowId } = useFlowStore();
  const { visible } = useViewStore();

  const { vines } = useVinesFlow();

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  const disabled = vines.executionStatus === 'RUNNING';

  const handleExecutionWorkflow = (inputData: Record<string, any> = {}) => vines.start({ inputData });

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const finalHeight = height - 68;

  return (
    <div ref={ref} className="relative flex size-full p-6">
      <ChatSidebar />
      <motion.div
        key="vines-view-chat"
        className={cn(
          'flex flex-1 flex-col gap-4 overflow-hidden p-4 pb-0',
          hasMoreThanOneInput && !openAIInterfaceEnabled && 'flex-row',
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {openAIInterfaceEnabled ? (
          <OpenAIChat multipleChat={useOpenAIInterface.multipleChat} />
        ) : (
          <>
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
                <AnInput disabled={disabled} inputs={workflowInput} onClick={handleExecutionWorkflow} />
              )
            ) : (
              <EmptyInput disabled={disabled} onClick={handleExecutionWorkflow} />
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};
