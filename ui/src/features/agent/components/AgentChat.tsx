/**
 * AgentChat 组件 - 使用 assistant-ui 的完整聊天界面
 */

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { Thread } from '@/components/assistant-ui/thread';
import { useAgentChat } from '../hooks/useAgentChat';

interface AgentChatProps {
  threadId: string;
  teamId: string;
  userId: string;
  agentId?: string;
  modelId?: string;
  className?: string;
}

/**
 * Agent 聊天组件
 *
 * 使用 assistant-ui 提供的完整 UI 组件
 * Thread 组件会自动渲染欢迎消息、消息列表和输入框
 * 参考：https://www.assistant-ui.com/examples/ai-sdk
 */
export function AgentChat({
  threadId,
  teamId,
  userId,
  agentId,
  modelId,
  className = '',
}: AgentChatProps) {
  const { runtime } = useAgentChat({
    threadId,
    teamId,
    userId,
    agentId,
    modelId,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Thread className={`h-full ${className}`} />
    </AssistantRuntimeProvider>
  );
}
