import React from 'react';

import { useGetAgent } from '@/apis/agents';
import { ChatSidebar } from '@/components/layout/workspace/vines-view/chat/sidebar';
import { useAgentStore } from '@/store/useAgentStore';
import { usePageStore } from '@/store/usePageStore';
import { cn } from '@/utils';
import { VinesChatMode } from '@/view/vines-chat/chat-bot.tsx';

export const AgentChatView: React.FC = () => {
  const workbenchVisible = usePageStore((s) => s.workbenchVisible);

  const agentId = useAgentStore((s) => s.agentId);

  const { data: agentData } = useGetAgent(agentId);

  return (
    <div className={cn('relative flex h-full max-h-full p-6', workbenchVisible && 'p-0 pl-4')}>
      <ChatSidebar id={agentId} />
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 pb-0">
        <VinesChatMode multipleChat id={agentId} botPhoto={agentData?.iconUrl} />
      </div>
    </div>
  );
};
