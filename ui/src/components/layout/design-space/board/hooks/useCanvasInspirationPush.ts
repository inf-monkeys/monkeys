import { useEffect, useRef, useCallback } from 'react';
import { Editor } from 'tldraw';

interface UseCanvasInspirationPushOptions {
  editor: Editor | null;
  teamId?: string;
  userId?: string;
  threadId?: string;
  enabled?: boolean;
  idleTimeout?: number; // 毫秒，默认45秒
  onInspirationPushed?: (result: any) => void;
}

interface CanvasData {
  shapes: any[];
  selectedShapeIds?: string[];
  viewport?: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * Canvas 灵感推送 Hook
 *
 * 功能：
 * - 监听用户在画布上的操作
 * - 45秒无操作后自动触发灵感推送
 * - 调用后端API分析创作状态（发散/收敛/停滞）
 * - 向用户推送灵感建议
 */
export function useCanvasInspirationPush(options: UseCanvasInspirationPushOptions) {
  const {
    editor,
    teamId,
    userId,
    threadId,
    enabled = true,
    idleTimeout = 45000, // 45秒
    onInspirationPushed,
  } = options;

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPushingRef = useRef<boolean>(false);

  /**
   * 获取画布数据
   */
  const getCanvasData = useCallback((): CanvasData | null => {
    if (!editor) return null;

    try {
      const shapes = editor.getCurrentPageShapes().map((shape) => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        props: shape.props,
        meta: shape.meta,
      }));

      const selectedShapeIds = editor.getSelectedShapeIds();
      const viewport = editor.getViewportPageBounds();

      return {
        shapes,
        selectedShapeIds: Array.from(selectedShapeIds),
        viewport: {
          x: viewport.x,
          y: viewport.y,
          z: editor.getZoomLevel(),
        },
      };
    } catch (error) {
      console.error('[CanvasInspiration] 获取画布数据失败:', error);
      return null;
    }
  }, [editor]);

  /**
   * 检查是否应该推送
   */
  const checkShouldPush = useCallback(async (): Promise<boolean> => {
    if (!threadId || !teamId) {
      console.warn('[CanvasInspiration] 缺少 threadId 或 teamId，跳过推送');
      return false;
    }

    try {
      const url = `/api/agents/canvas/should-push-inspiration?threadId=${threadId}&teamId=${teamId}`;
      const response = await fetch(url);
      const result = await response.json();

      console.log('[CanvasInspiration] 检查推送条件:', result);

      return result.data?.shouldPush ?? true;
    } catch (error) {
      console.error('[CanvasInspiration] 检查推送条件失败:', error);
      return true; // 失败时默认允许推送
    }
  }, [threadId, teamId]);

  /**
   * 执行灵感推送
   */
  const pushInspiration = useCallback(
    async (canvasData: CanvasData): Promise<any> => {
      if (!teamId || !userId || !threadId) {
        console.warn('[CanvasInspiration] 缺少必要参数，跳过推送');
        return null;
      }

      try {
        const url = '/api/agents/canvas/push-inspiration';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            userId,
            threadId,
            canvasData,
            selectedShapeIds: canvasData.selectedShapeIds,
            viewport: canvasData.viewport,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('[CanvasInspiration] 推送成功:', result);

        return result.data;
      } catch (error) {
        console.error('[CanvasInspiration] 推送失败:', error);
        throw error;
      }
    },
    [teamId, userId, threadId],
  );

  /**
   * 触发灵感推送
   */
  const triggerInspiration = useCallback(async () => {
    if (isPushingRef.current) {
      console.log('[CanvasInspiration] 正在推送中，跳过');
      return;
    }

    console.log('🚀 [CanvasInspiration] 触发灵感推送（45秒无操作）');

    try {
      isPushingRef.current = true;

      // 1. 获取画布数据
      const canvasData = getCanvasData();
      if (!canvasData) {
        console.warn('[CanvasInspiration] 无法获取画布数据，跳过推送');
        return;
      }

      console.log('[CanvasInspiration] 画布数据:', {
        图形数量: canvasData.shapes.length,
        选中数量: canvasData.selectedShapeIds?.length || 0,
      });

      // 2. 检查是否应该推送
      console.log('🔍 [CanvasInspiration] 检查推送条件...');
      const shouldPush = await checkShouldPush();
      console.log(`[CanvasInspiration] shouldPush = ${shouldPush}`);

      if (!shouldPush) {
        console.warn('[CanvasInspiration] 不满足推送条件（可能在冷却期或Thread正在运行）');
        return;
      }

      console.log('✅ [CanvasInspiration] 推送条件满足，开始推送...');

      // 3. 执行推送
      const startTime = Date.now();
      const result = await pushInspiration(canvasData);
      const duration = Date.now() - startTime;

      console.log('✨ [CanvasInspiration] 推送成功!', {
        耗时: `${duration}ms`,
        消息ID: result?.messageId,
        创作状态: result?.state,
        建议数量: result?.suggestionCount,
      });

      // 4. 回调通知
      if (onInspirationPushed && result) {
        onInspirationPushed(result);
      }
    } catch (error) {
      console.error('❌ [CanvasInspiration] 推送失败:', error);
    } finally {
      isPushingRef.current = false;
    }
  }, [getCanvasData, checkShouldPush, pushInspiration, onInspirationPushed]);

  /**
   * 记录用户活动
   */
  const onActivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    lastActivityTimeRef.current = now;

    // 重置计时器
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // 启动新的计时器
    idleTimerRef.current = setTimeout(() => {
      triggerInspiration();
    }, idleTimeout);
  }, [enabled, idleTimeout, triggerInspiration]);

  /**
   * 启动倒计时日志显示（开发时查看）
   */
  useEffect(() => {
    if (!enabled) return;

    const checkInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityTimeRef.current;
      const remainingTime = idleTimeout - idleTime;

      if (remainingTime > 0) {
        const seconds = Math.floor(remainingTime / 1000);

        // 每1秒打印一次
        if (seconds % 1 === 0 && seconds > 0) {
          console.log(
            `⏱️  [CanvasInspiration] 距离灵感推送: ${seconds}秒 (已无操作: ${Math.floor(idleTime / 1000)}秒)`,
          );
        }
      }
    }, 1000);

    checkIntervalRef.current = checkInterval;

    return () => {
      clearInterval(checkInterval);
    };
  }, [enabled, idleTimeout]);

  /**
   * 监听画布变化事件
   */
  useEffect(() => {
    if (!editor || !enabled) return;

    // 监听编辑器变化
    const handleChange = () => {
      onActivity();
    };

    editor.on('change', handleChange);

    // 初始化时记录一次活动
    onActivity();

    return () => {
      editor.off('change', handleChange);

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [editor, enabled, onActivity]);

  /**
   * 手动测试推送（开发调试用）
   */
  const testPush = useCallback(
    async (scenario: 'empty' | 'divergent' | 'convergent' | 'complex' = 'divergent') => {
      if (!teamId || !userId || !threadId) {
        console.warn('[CanvasInspiration] 缺少必要参数，无法测试');
        return null;
      }

      console.log('🧪 [CanvasInspiration] 手动测试推送', { scenario });

      try {
        const url = '/api/agents/canvas/test-inspiration';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            userId,
            threadId,
            scenario,
          }),
        });

        const result = await response.json();
        console.log('✅ [CanvasInspiration] 测试成功:', result);

        if (onInspirationPushed && result.data) {
          onInspirationPushed(result.data);
        }

        return result.data;
      } catch (error) {
        console.error('❌ [CanvasInspiration] 测试失败:', error);
        throw error;
      }
    },
    [teamId, userId, threadId, onInspirationPushed],
  );

  return {
    onActivity,
    testPush,
  };
}
