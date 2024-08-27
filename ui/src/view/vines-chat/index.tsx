import React, { useState } from 'react';

import { motion } from 'framer-motion';
import { reduce, toNumber } from 'lodash';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChatSidebar } from '@/components/layout/workspace/vines-view/chat/sidebar';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';
import { VinesWorkflowMode } from '@/view/vines-chat/workflow-mode.tsx';

export const VinesChatView: React.FC = () => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const workbenchVisible = usePageStore((s) => s.workbenchVisible);
  const vinesIFrameVisible = usePageStore((s) => s.vinesIFrameVisible);

  const workflowId = useFlowStore((s) => s.workflowId);

  const workflowInput = vines.workflowInput;
  const workflowInputLength = workflowInput.length;

  const hasMoreThanOneInput = workflowInputLength > 1;

  const disabled = vines.executionStatus() === 'RUNNING';

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const extraBody = reduce(
    vines.workflowInput.filter((it) => it.default !== void 0 && !['stream', 'messages'].includes(it.name)),
    function (acc, curr) {
      acc[curr.name] = curr.type === 'number' ? toNumber(curr?.default) : curr.default;
      return acc;
    },
    {},
  );

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const containerHeight = usePageStore((s) => s.containerHeight);
  const height = containerHeight - (vinesIFrameVisible ? 70 : workbenchVisible ? 36 : 48);

  return (
    <div className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <motion.div
        key="vines-view-chat"
        className={cn(
          'flex flex-1 flex-col overflow-hidden',
          workbenchVisible ? 'p-4 pl-0' : 'pr-4',
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
            height={height}
          />
        ) : (
          <VinesWorkflowMode height={height} disabled={disabled} />
        )}
      </motion.div>

      <div className="group z-10 -mr-4 h-full w-4 after:absolute after:top-0 after:-ml-4 after:h-full after:w-4">
        <Separator
          orientation="vertical"
          className={cn(
            'vines-center before:absolute before:z-20 before:h-full before:w-1 before:cursor-pointer before:transition-all before:hover:bg-border',
          )}
          onClick={() => setSidebarVisible(!sidebarVisible)}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="group z-10 -ml-4 flex h-6 w-4 cursor-pointer items-center justify-center rounded-l-sm border bg-border px-0.5 opacity-0 transition-opacity hover:opacity-75 active:opacity-95 group-hover:opacity-100">
                <ChevronLeft className={cn(sidebarVisible && 'scale-x-[-1]')} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarVisible ? t('workspace.chat-view.sidebar.collapse') : t('workspace.chat-view.sidebar.expand')}
            </TooltipContent>
          </Tooltip>
        </Separator>
      </div>
      <ChatSidebar className="py-4" id={workflowId} isWorkflowMode sidebarVisible={sidebarVisible} side="right" />
    </div>
  );
};
