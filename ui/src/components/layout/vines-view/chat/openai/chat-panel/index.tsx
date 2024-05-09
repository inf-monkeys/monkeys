import React, { useEffect } from 'react';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { IApiKeyStatus } from '@/apis/api-keys/typings.ts';
import { useOpenAIInterfaceChatHistory } from '@/apis/workflow/chat';
import { useChat } from '@/components/layout/vines-view/chat/openai/chat-panel/useChat.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface IChatPanelProps {
  workflowId: string;
  chatId: string;
}

export interface IMessage {
  content: string;
  role: 'user' | 'assistant';
}

export const ChatPanel: React.FC<IChatPanelProps> = ({ workflowId, chatId }) => {
  const { data: apiKeys } = useApiKeyList();
  const finalApikey = apiKeys?.find((key) => key.status === IApiKeyStatus.Valid);

  const { data: history } = useOpenAIInterfaceChatHistory(chatId);

  const { input, setInput, handleChat, handleSubmit, isLoading, setMessages } = useChat(
    chatId,
    workflowId,
    finalApikey?.apiKey,
    history,
  );

  useEffect(() => {
    if (history) {
      void setMessages(history);
    }
  }, [history]);

  const handleChatMessage = () => {
    handleSubmit();
    void handleChat();
  };

  return (
    <div className="flex justify-between gap-4 py-2">
      <Input
        placeholder="聊些什么..."
        value={input}
        onChange={setInput}
        onEnterPress={handleChatMessage}
        disabled={isLoading}
      />
      <Button variant="outline" onClick={handleChatMessage} loading={isLoading}>
        发送
      </Button>
    </div>
  );
};
