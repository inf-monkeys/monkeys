import React from 'react';

import { motion } from 'framer-motion';
import { ChatSidebar } from 'src/components/layout/vines-view/chat/sidebar';

import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';
import { VinesWorkflowMode } from '@/view/vines-chat/workflow-mode.tsx';

export const VinesChatView: React.FC = () => {
  const { ref, height } = useElementSize();

  const { vines } = useVinesFlow();
  const { workbenchVisible } = usePageStore();

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  const disabled = vines.executionStatus === 'RUNNING';

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const finalHeight = height - 68;

  return (
    <div ref={ref} className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
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
          <VinesChatMode multipleChat={useOpenAIInterface.multipleChat} />
        ) : (
          <VinesWorkflowMode height={finalHeight} disabled={disabled} />
        )}
      </motion.div>
    </div>
  );
};
