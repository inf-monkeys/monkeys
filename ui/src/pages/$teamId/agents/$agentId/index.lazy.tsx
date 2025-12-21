/**
 * Agent 聊天页面 - 使用自定义 ThreadList 实现
 */

import { createLazyFileRoute } from '@tanstack/react-router';
import { AgentRuntimeProvider } from '@/features/agent/components/AgentRuntimeProvider';
import { SimpleThreadList } from '@/features/agent/components/SimpleThreadList';
import { Thread } from '@/components/assistant-ui/thread';
import { useAgent } from '@/features/agent/hooks/useAgent';
import { useUser } from '@/apis/authz/user';
import { Loader2, MessageSquare } from 'lucide-react';

export function AgentChatPage() {
  const { teamId, agentId } = Route.useParams();

  // 获取当前登录用户
  const { data: user } = useUser();
  const userId = user?.id || '';

  // 加载 Agent 信息
  const { data: agent, loading: loadingAgent } = useAgent(agentId, teamId);

  // 加载中状态
  if (loadingAgent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">Loading agent...</div>
        </div>
      </div>
    );
  }

  // Agent 不存在
  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">Agent not found</div>
      </div>
    );
  }

  // 用户未登录
  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">Please login to continue</div>
      </div>
    );
  }

  return (
    <AgentRuntimeProvider teamId={teamId} userId={userId} agentId={agentId}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Left Sidebar - SimpleThreadList */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r bg-background">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <h2 className="font-semibold text-base">{agent.name}</h2>
              {agent.description && (
                <p className="text-muted-foreground text-xs line-clamp-1">
                  {agent.description}
                </p>
              )}
            </div>
          </div>

          {/* SimpleThreadList - 自定义组件 */}
          <div className="flex-1 overflow-y-auto">
            <SimpleThreadList className="p-3" />
          </div>
        </aside>

        {/* Right - Chat Area */}
        <main className="flex-1 overflow-hidden">
          <Thread />
        </main>
      </div>
    </AgentRuntimeProvider>
  );
}

export const Route = createLazyFileRoute('/$teamId/agents/$agentId/')({
  component: AgentChatPage,
});
