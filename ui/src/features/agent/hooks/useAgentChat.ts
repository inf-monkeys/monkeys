/**
 * useAgentChat hook - 使用 assistant-ui 原生 AI SDK 集成
 */

import { useMemo } from 'react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useThreadMessages } from './useThread';

interface UseAgentChatOptions {
  threadId: string;
  teamId: string;
  userId: string;
  agentId?: string;
  modelId?: string;
}

/**
 * 使用 assistant-ui 原生 AI SDK 集成的聊天 hook
 */
export function useAgentChat(options: UseAgentChatOptions) {
  const { threadId, teamId, userId, agentId, modelId } = options;

  // 获取历史消息
  const { data: historyMessages = [] } = useThreadMessages(threadId, teamId);

  // 转换历史消息为 AI SDK 格式
  const initialMessages = useMemo(() => {
    return historyMessages
      .filter((msg) => msg.role !== 'system') // 过滤掉 system 消息
      .map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.parts
          .filter((part) => part.type === 'text' && part.text)
          .map((part) => part.text)
          .join('\n'),
      }));
  }, [historyMessages]);

  // 使用 assistant-ui 的 useChatRuntime
  const runtime = useChatRuntime({
    api: `/api/v1/agents/threads/${threadId}/chat`,
    initialMessages,
    body: {
      teamId,
      userId,
      agentId,
      modelId,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return { runtime };
}
