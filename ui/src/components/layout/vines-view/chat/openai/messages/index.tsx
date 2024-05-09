import React from 'react';

import { useChat } from '@/components/layout/vines-view/chat/openai/chat-panel/useChat.ts';
import { VirtualizedList } from '@/components/layout/vines-view/chat/openai/messages/virtualized';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { useVinesFlow } from '@/package/vines-flow';

interface IOpenAIMessagesProps {
  chatId: string;
}

export const OpenAIMessages: React.FC<IOpenAIMessagesProps> = ({ chatId }) => {
  const { messages = [] } = useChat(chatId);

  const { userPhoto } = useVinesUser();
  const { vines } = useVinesFlow();

  return <VirtualizedList data={messages} userPhoto={userPhoto} botPhoto={vines.workflowIcon} />;
};
