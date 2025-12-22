/**
 * AgentChatPage - 完整的 Agent 聊天页面示例
 * 展示如何使用 ThreadListRuntime
 */

import { AgentRuntimeProvider } from '../components/AgentRuntimeProvider';
import { ThreadList } from '@/components/assistant-ui/thread-list';
import { Thread } from '@/components/assistant-ui/thread';
import { useThreadListRuntime } from '../hooks/useThreadListRuntime';

interface AgentChatPageProps {
  teamId: string;
  userId: string;
  agentId?: string;
}

/**
 * 使用 AgentRuntimeProvider 的简单示例
 */
export function AgentChatPageSimple({ teamId, userId, agentId }: AgentChatPageProps) {
  return (
    <AgentRuntimeProvider teamId={teamId} userId={userId} agentId={agentId}>
      <div className="flex h-screen">
        {/* 左侧 Thread 列表 */}
        <aside className="w-64 flex-shrink-0 border-r bg-muted/30">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold text-lg">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ThreadList className="p-2" />
            </div>
          </div>
        </aside>

        {/* 右侧聊天界面 */}
        <main className="flex-1">
          <Thread />
        </main>
      </div>
    </AgentRuntimeProvider>
  );
}

/**
 * 使用 useThreadListRuntime hook 的高级示例
 */
export function AgentChatPageAdvanced({ teamId, userId, agentId }: AgentChatPageProps) {
  const { runtime, isLoadingThreads, currentThreadId, threads } = useThreadListRuntime({
    teamId,
    userId,
    agentId,
  });

  return (
    <div className="flex h-screen">
      {/* 左侧 Thread 列表 */}
      <aside className="w-64 flex-shrink-0 border-r bg-muted/30">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold text-lg">Conversations</h2>
            <span className="text-muted-foreground text-sm">{threads.length}</span>
          </div>

          {isLoadingThreads ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-muted-foreground text-sm">Loading...</div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <ThreadList className="p-2" />
            </div>
          )}

          {/* 当前 Thread 信息 */}
          {currentThreadId && (
            <div className="border-t p-3 text-muted-foreground text-xs">
              Active: {currentThreadId.slice(0, 8)}...
            </div>
          )}
        </div>
      </aside>

      {/* 右侧聊天界面 */}
      <main className="flex-1">
        {currentThreadId ? (
          <Thread />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="mb-2 text-lg">No conversation selected</p>
              <p className="text-sm">Create a new conversation to get started</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
