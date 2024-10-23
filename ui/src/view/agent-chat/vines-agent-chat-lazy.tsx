import React, { useState } from 'react';

import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetAgent } from '@/apis/agents';
import { ChatSidebar } from '@/components/layout/workspace/vines-view/chat/sidebar';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAgentStore } from '@/store/useAgentStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';

const AgentChatView: React.FC = () => {
  const { t } = useTranslation();

  const containerHeight = usePageStore((s) => s.containerHeight);
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const [sidebarVisible, setSidebarVisible] = useState(!workbenchVisible);

  const agentId = useAgentStore((s) => s.agentId);

  const { data: agentData } = useGetAgent(agentId);

  return (
    <div className={cn('relative flex h-full max-h-full', workbenchVisible ? 'p-0' : 'p-6 pr-2')}>
      <div className={cn('flex flex-1 flex-col overflow-hidden', workbenchVisible ? 'p-4' : 'pr-4')}>
        <VinesChatMode
          multipleChat
          id={agentId}
          botPhoto={agentData?.iconUrl}
          height={containerHeight - (workbenchVisible ? 32 : 48)}
        />
      </div>
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

      <ChatSidebar className="py-4" id={agentId} sidebarVisible={sidebarVisible} side="right" />
    </div>
  );
};

export default AgentChatView;
