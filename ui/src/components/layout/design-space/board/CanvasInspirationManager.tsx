/**
 * Canvas Inspiration Manager Component
 *
 * 这个组件负责：
 * 1. 监听 AgentRuntimeProvider 中的 currentThreadId
 * 2. 使用 useCanvasInspirationPush Hook 实现60秒空闲检测
 * 3. 触发灵感推送到当前 Thread
 */

import { useEffect, useRef } from 'react';
import { Editor } from 'tldraw';
import { useThreadListContext } from '@/features/agent/components/AgentRuntimeProvider';
import { useCanvasInspirationPush } from './hooks/useCanvasInspirationPush';

interface CanvasInspirationManagerProps {
  editor: Editor | null;
  teamId?: string;
  userId?: string;
  enabled?: boolean;
}

export function CanvasInspirationManager({
  editor,
  teamId,
  userId,
  enabled = true,
}: CanvasInspirationManagerProps) {
  // 获取当前 thread ID
  const { currentThreadId } = useThreadListContext();

  // 保存推送时使用的 threadId，确保切换时使用正确的 ID
  const pushRequestThreadIdRef = useRef<string | null>(null);

  // 每次 currentThreadId 变化时更新 ref
  useEffect(() => {
    pushRequestThreadIdRef.current = currentThreadId || null;
  }, [currentThreadId]);

  // 使用灵感推送 Hook
  const { testPush } = useCanvasInspirationPush({
    editor,
    teamId,
    userId,
    threadId: currentThreadId || undefined,
    enabled: enabled && !!currentThreadId, // 只有在有 threadId 时才启用
    onInspirationPushed: async (result) => {
      console.log('✨ [CanvasInspiration] 灵感推送成功，准备通知切换', result);

      // 从result中获取threadId（后端可能创建了新thread）
      const resultThreadId = result?.threadId || result?.thread?.id;
      const fallbackThreadId = pushRequestThreadIdRef.current || currentThreadId;
      const targetThreadId = resultThreadId || fallbackThreadId;

      console.log('🎯 [CanvasInspiration] threadId信息:', {
        resultThreadId,
        fallbackThreadId,
        finalTargetThreadId: targetThreadId,
        result,
      });

      if (!targetThreadId) {
        console.error('❌ [CanvasInspiration] 无法确定目标threadId');
        return;
      }

      // 只发送事件，让ExternalLayerPanel处理切换逻辑
      console.log('📢 [CanvasInspiration] 发送 agent:inspiration-pushed 事件');
      window.dispatchEvent(
        new CustomEvent('agent:inspiration-pushed', {
          detail: {
            threadId: targetThreadId,
            result,
          },
        }),
      );

      console.log('✅ [CanvasInspiration] 事件已发送，等待面板处理');
    },
  });

  // 将 testPush 暴露到 window，方便调试
  useEffect(() => {
    (window as any).testInspirationPush = testPush;
    console.log('🎨 [CanvasInspiration] 已挂载，currentThreadId:', currentThreadId);

    return () => {
      delete (window as any).testInspirationPush;
    };
  }, [testPush, currentThreadId]);

  // 此组件不渲染任何 UI
  return null;
}
