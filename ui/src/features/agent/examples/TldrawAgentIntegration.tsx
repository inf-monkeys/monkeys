/**
 * TldrawAgentIntegration - tldraw 与 Agent 集成示例
 *
 * 本示例展示如何在 tldraw 画布中集成 Agent 聊天功能
 */

import { useState, useEffect } from 'react';
import { AgentSidebar, useAgentEvent } from '@/features/agent';
import { Bot, X, Keyboard } from 'lucide-react';

interface TldrawAgentIntegrationProps {
  /** Team ID */
  teamId: string;
  /** User ID */
  userId: string;
  /** Agent ID（可选，默认使用 tldraw 专用 Agent） */
  agentId?: string;
}

export function TldrawAgentIntegration({
  teamId,
  userId,
  agentId = 'tldraw-assistant',
}: TldrawAgentIntegrationProps) {
  const [showAgent, setShowAgent] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 监听快捷键 Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowAgent((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 监听 Agent 打开事件
  useAgentEvent('agent:open', (detail) => {
    if (detail.agentId === agentId) {
      setShowAgent(true);
    }
  }, [agentId]);

  // 监听 Agent 关闭事件
  useAgentEvent('agent:close', (detail) => {
    if (!detail.agentId || detail.agentId === agentId) {
      setShowAgent(false);
    }
  }, [agentId]);

  return (
    <>
      {/* Agent 触发按钮 */}
      <div className="fixed top-4 right-4 z-40">
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl dark:bg-gray-800 dark:hover:bg-gray-700"
            onClick={() => setShowAgent(!showAgent)}
            aria-label="Toggle AI Agent"
          >
            {showAgent ? (
              <>
                <X className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  Close Agent
                </span>
              </>
            ) : (
              <>
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm text-gray-700 dark:text-gray-200">
                  AI Agent
                </span>
              </>
            )}
          </button>

          {/* Tooltip */}
          {showTooltip && !showAgent && (
            <div className="absolute right-0 top-full mt-2 flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-white text-xs shadow-lg dark:bg-gray-700">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Press ⌘K to toggle</span>
            </div>
          )}
        </div>
      </div>

      {/* Agent 侧边栏 */}
      <AgentSidebar
        agentId={agentId}
        teamId={teamId}
        userId={userId}
        visible={showAgent}
        onClose={() => setShowAgent(false)}
        position="right"
        defaultWidth={600}
        minWidth={400}
        maxWidth={900}
        showThreadList={true}
        resizable={true}
      />
    </>
  );
}

/**
 * 使用示例:
 *
 * ```tsx
 * import { Tldraw } from '@tldraw/tldraw';
 * import { TldrawAgentIntegration } from '@/features/agent/examples/TldrawAgentIntegration';
 *
 * function MyTldrawPage() {
 *   return (
 *     <div className="relative h-screen w-screen">
 *       {/* tldraw 画布
 *       <Tldraw />
 *
 *       {/* Agent 集成
 *       <TldrawAgentIntegration
 *         teamId="your-team-id"
 *         userId="your-user-id"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
