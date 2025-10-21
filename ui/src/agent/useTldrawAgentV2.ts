import { getVinesToken } from '@/apis/utils.ts';
import { getVinesTeamId } from '@/components/router/guard/team.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from 'tldraw';

export type TldrawAgentV2Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

export type TldrawAgentV2API = {
  history: TldrawAgentV2Message[];
  isStreaming: boolean;
  push: (role: 'user' | 'assistant' | 'system', content: string) => void;
  request: (input: { message: string; context?: any }) => Promise<string>;
  cancel: () => void;
  reset: () => void;
};

export function useTldrawAgentV2(editor: Editor | null): TldrawAgentV2API | null {
  const [history, setHistory] = useState<TldrawAgentV2Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const streamingIdxRef = useRef<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const serverBaseRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const historyRef = useRef(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const agentApi = useMemo(() => {
    if (!editor) return null;

    const push = (role: 'user' | 'assistant' | 'system', content: string) =>
      setHistory((h) => [...h, { role, content, timestamp: Date.now() }]);

    const resolveServerBase = async (): Promise<string | null> => {
      if (serverBaseRef.current) return serverBaseRef.current;

      try {
        const response = await fetch('/api/configs');
        const data = await response.json();
        const serverUrl = data?.data?.endpoints?.serverUrl + '/api';

        if (serverUrl) {
          serverBaseRef.current = String(serverUrl).replace(/\/$/, '');
        }
      } catch (e) {}

      return serverBaseRef.current;
    };

    const generateSessionId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const getVisualContext = () => {
      if (!editor) {
        return { viewport: null, selectionIds: [], shapes: [], screenshot: null as string | null };
      }

      try {
        const viewport = editor.getViewportPageBounds();
        const selectionIds = editor.getSelectedShapeIds().map(id => id.replace('shape:', ''));
        const shapes = editor.getCurrentPageShapes().slice(0, 100).map(shape => ({
          id: shape.id.replace('shape:', ''),
          type: shape.type,
          x: shape.x,
          y: shape.y,
          w: (shape as any).w || 0,
          h: (shape as any).h || 0,
          props: shape.props,
        }));

        return { viewport, selectionIds, shapes, screenshot: null as string | null };
      } catch (error) {
        console.warn('Failed to get visual context:', error);
        return { viewport: null, selectionIds: [], shapes: [], screenshot: null as string | null };
      }
    };

    const captureViewportImage = async (): Promise<string | null> => {
      try {
        // 这里需要实现截图功能
        // 可以使用tldraw的截图API或者canvas截图
        return null;
      } catch (error) {
        console.warn('Failed to capture viewport image:', error);
        return null;
      }
    };

    const request = async (input: { message: string; context?: any }): Promise<string> => {
      push('user', input.message);
      let resultMessage = '已发送到 Agent V2（流式）';

      const finalize = () => {
        streamingIdxRef.current = null;
        setIsStreaming(false);
        abortRef.current = null;
      };

      const upsertAssistantMessage = (message: string, replace = false) => {
        setHistory((h) => {
          const newHistory = [...h];
          if (streamingIdxRef.current !== null && newHistory[streamingIdxRef.current]) {
            if (replace) {
              newHistory[streamingIdxRef.current] = {
                ...newHistory[streamingIdxRef.current],
                content: message,
              };
            } else {
              newHistory[streamingIdxRef.current] = {
                ...newHistory[streamingIdxRef.current],
                content: newHistory[streamingIdxRef.current].content + message,
              };
            }
          }
          return newHistory;
        });
      };

      try {
        const base = await resolveServerBase();
        if (!base) {
          const msg = '无法获取服务器地址';
          push('assistant', msg);
          finalize();
          return msg;
        }

        const context = getVisualContext();
        const screenshot = await captureViewportImage();
        context.screenshot = screenshot;

        const sessionId = generateSessionId();
        sessionIdRef.current = sessionId;

        setHistory((h) => {
          streamingIdxRef.current = h.length;
          setIsStreaming(true);
          return [...h, { role: 'assistant' as const, content: '', timestamp: Date.now() }];
        });

        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch(`${base}/tldraw-agent-v2/stream`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(getVinesToken() && { Authorization: `Bearer ${getVinesToken()}` }),
            ...(getVinesTeamId() && { 'x-monkeys-teamid': getVinesTeamId() }),
          },
          body: JSON.stringify({ 
            ...input, 
            context, 
            sessionId,
            // 不发送假的认证信息，让后端从token中解析
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => '');
          const msg = `服务器错误：${text || response.statusText}`;
          upsertAssistantMessage(msg, true);
          finalize();
          return msg;
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          if (controller.signal.aborted) throw new Error('aborted');

          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let index;
          while ((index = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            if (!chunk) continue;

            const lines = chunk.split('\n');
            let eventName: string | null = null;
            let dataStr: string | null = null;

            for (const ln of lines) {
              if (ln.startsWith('event:')) {
                eventName = ln.slice(6).trim();
              } else if (ln.startsWith('data:')) {
                dataStr = (dataStr ?? '') + ln.slice(5).trim();
              }
            }

            if (dataStr === '[DONE]') {
              finalize();
              continue;
            }
            if (!dataStr) continue;

            try {
              const json = JSON.parse(dataStr);

              if (eventName === 'delta' && json.content) {
                upsertAssistantMessage(json.content);
              } else if (eventName === 'action' && json.action) {
                // 处理工具调用
                console.log('Tool action received:', json.action);
                // 这里可以添加工具调用的可视化反馈
              } else if (eventName === 'done') {
                finalize();
              } else if (eventName === 'error') {
                upsertAssistantMessage(`错误：${json.message}`, true);
                finalize();
              }
            } catch {
              // 如果不是JSON，直接作为文本处理
              upsertAssistantMessage(dataStr);
            }
          }
        }

        finalize();
        return resultMessage;
      } catch (error) {
        const message = (error as Error)?.message;
        if (message === 'aborted') {
          upsertAssistantMessage('任务已取消', true);
        } else {
          const errorMsg = message || '处理失败';
          upsertAssistantMessage(`错误：${errorMsg}`, true);
        }
        finalize();
        return message || '处理失败';
      }
    };

    const cancel = () => {
      if (abortRef.current && !abortRef.current.signal.aborted) {
        abortRef.current.abort();
      }
      if (readerRef.current) {
        readerRef.current.cancel();
      }
    };

    const reset = () => {
      cancel();
      setHistory([]);
      setIsStreaming(false);
      sessionIdRef.current = null;
    };

    return {
      history: historyRef.current,
      isStreaming,
      push,
      request,
      cancel,
      reset,
    };
  }, [editor]);

  return agentApi;
}
