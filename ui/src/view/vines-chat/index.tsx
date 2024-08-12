import React from 'react';

import { motion } from 'framer-motion';
import { reduce, toNumber } from 'lodash';

import { ChatSidebar } from '@/components/layout/workspace/vines-view/chat/sidebar';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';
import { VinesWorkflowMode } from '@/view/vines-chat/workflow-mode.tsx';

export const VinesChatView: React.FC = () => {
  const { ref, height } = useElementSize();

  const { vines } = useVinesFlow();

  const workbenchVisible = usePageStore((s) => s.workbenchVisible);
  const workflowId = useFlowStore((s) => s.workflowId);

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  const disabled = vines.executionStatus === 'RUNNING';

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const finalHeight = height - 68;

  const extraBody = reduce(
    vines.workflowInput.filter((it) => it.default !== void 0 && !['stream', 'messages'].includes(it.name)),
    function (acc, curr) {
      acc[curr.name] = curr.type === 'number' ? toNumber(curr?.default) : curr.default;
      return acc;
    },
    {},
  );

  return (
    <div ref={ref} className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <ChatSidebar id={workflowId} showDefaultSession />
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
          <VinesChatMode
            multipleChat={useOpenAIInterface.multipleChat}
            id={workflowId}
            extraBody={extraBody}
            botPhoto={vines.workflowIcon}
          />
        ) : (
          <VinesWorkflowMode height={finalHeight} disabled={disabled} />
        )}
      </motion.div>
    </div>
  );
};
