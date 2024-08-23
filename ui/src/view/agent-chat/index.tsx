import React, { useState } from 'react';

import { useThrottleEffect } from 'ahooks';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetAgent } from '@/apis/agents';
import { ChatSidebar } from '@/components/layout/workspace/vines-view/chat/sidebar';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { useAgentStore } from '@/store/useAgentStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';

export const AgentChatView: React.FC = () => {
  const { t } = useTranslation();
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const agentId = useAgentStore((s) => s.agentId);

  const { data: agentData } = useGetAgent(agentId);

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight - 6);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div className={cn('relative flex h-full max-h-full', workbenchVisible ? 'p-0' : 'p-6 pr-2')}>
      <div ref={ref} className={cn('flex flex-1 flex-col overflow-hidden', workbenchVisible ? 'p-4' : 'pr-4')}>
        <VinesChatMode multipleChat id={agentId} botPhoto={agentData?.iconUrl} height={height} />
      </div>
      <Separator orientation="vertical" className="vines-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="group z-10 -ml-4 flex h-6 w-4 cursor-pointer items-center justify-center rounded-l-sm border bg-border px-0.5 transition-opacity hover:opacity-75 active:opacity-95"
              onClick={() => setSidebarVisible(!sidebarVisible)}
            >
              <ChevronLeft className={cn(sidebarVisible && 'scale-x-[-1]')} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarVisible ? t('workspace.chat-view.sidebar.collapse') : t('workspace.chat-view.sidebar.expand')}
          </TooltipContent>
        </Tooltip>
      </Separator>
      <ChatSidebar className="py-4" id={agentId} sidebarVisible={sidebarVisible} side="right" />
    </div>
  );
};
