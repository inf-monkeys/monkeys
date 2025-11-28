import { useEffect, useMemo, useRef, useState } from 'react';

import type { Editor } from 'tldraw';

import { getVinesToken } from '@/apis/utils.ts';
import { getVinesTeamId } from '@/components/router/guard/team.tsx';

export type TldrawAgentV3Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
};

export type TldrawAgentV3API = {
  history: TldrawAgentV3Message[];
  isStreaming: boolean;
  push: (role: 'user' | 'assistant' | 'system', content: string) => void;
  request: (input: { message: string; boardId?: string; modelId?: string }) => Promise<string>;
  cancel: () => void;
  reset: () => void;
};

type CanvasSnapshot = {
  nodes?: Array<{ id: string; type: string; x: number; y: number; w?: number; h?: number; props?: any }>;
  viewport?: any;
  selectionIds?: string[];
};

const applyToolCall = (editor: Editor | null, toolName: string, input: any) => {
  if (!editor) return;
  try {
    switch (toolName) {
      case 'create_workflow_node': {
        const id = input.id as string;
        const shapeId = `shape:${id}`;
        // 解析 props：如果是字符串则解析为对象，否则直接使用
        let props: any = {};
        if (typeof input.props === 'string') {
          try {
            props = JSON.parse(input.props);
          } catch (error) {
            console.warn('Failed to parse props JSON:', error);
            props = {};
          }
        } else if (input.props) {
          props = input.props;
        }
        // 确保 props 中有必要的属性
        props = {
          w: props.w ?? 280,
          h: props.h ?? 120,
          workflowId: props.workflowId || '',
          workflowName: props.workflowName || props.name || '未命名工作流',
          workflowDescription: props.workflowDescription || props.description || '',
          color: props.color || 'black',
          isRunning: false,
          connections: [],
          inputParams: props.inputParams || [],
          inputConnections: [],
          generatedTime: 0,
          ...props,
        };
        editor.createShape({
          id: shapeId,
          type: input.type,
          x: input.x,
          y: input.y,
          props,
        });
        break;
      }
      case 'update_workflow_node': {
        const id = input.id as string;
        const shapeId = `shape:${id}`;
        const shape = editor.getShape(shapeId);
        if (!shape) {
          console.warn(`Shape ${shapeId} not found`);
          return;
        }
        // 解析 props：如果是字符串则解析为对象，否则直接使用
        let newProps: any = {};
        if (typeof input.props === 'string') {
          try {
            newProps = JSON.parse(input.props);
          } catch (error) {
            console.warn('Failed to parse props JSON:', error);
            newProps = {};
          }
        } else if (input.props) {
          newProps = input.props;
        }
        // 合并现有 props 和新 props
        const updatedProps = {
          ...(shape as any).props,
          ...newProps,
        };
        editor.updateShape({
          id: shapeId,
          type: shape.type,
          props: updatedProps,
        });
        break;
      }
      case 'delete_workflow_node': {
        const id = input.id as string;
        const shapeId = `shape:${id}`;
        editor.deleteShape(shapeId);
        break;
      }
      case 'get_canvas_state':
      default:
        break;
    }
  } catch (error) {
    console.warn('applyToolCall failed', toolName, error);
  }
};

export function useTldrawAgentV3(editor: Editor | null, boardId?: string): TldrawAgentV3API | null {
  const [history, setHistory] = useState<TldrawAgentV3Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const streamingIdxRef = useRef<number | null>(null);
  const serverBaseRef = useRef<string | null>(null);
  // 改为 Map 以支持多画板独立 session
  const sessionIdMapRef = useRef<Map<string, string>>(new Map());
  // 为每个 boardId 维护独立的历史记录
  const historyMapRef = useRef<Map<string, TldrawAgentV3Message[]>>(new Map());
  // 记录已加载历史的 boardId
  const loadedBoardsRef = useRef<Set<string>>(new Set());
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const historyRef = useRef(history);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // 当 boardId 改变时，切换到对应的历史记录
  useEffect(() => {
    if (!boardId) return;

    const currentHistory = historyMapRef.current.get(boardId) || [];
    setHistory(currentHistory);

    // 如果该 boardId 还没有加载过历史记录，则加载
    if (!loadedBoardsRef.current.has(boardId)) {
      loadedBoardsRef.current.add(boardId);
      loadHistory(boardId);
    }
  }, [boardId]);

  const loadHistory = async (bid: string) => {
    if (!bid) return;

    try {
      const base = serverBaseRef.current || '/api';
      const response = await fetch(
        `${base}/tldraw-agent-v3/history?boardId=${encodeURIComponent(bid)}&page=1&limit=100`,
        {
          headers: {
            ...(getVinesToken() && { Authorization: `Bearer ${getVinesToken()}` }),
            ...(getVinesTeamId() && { 'x-monkeys-teamid': getVinesTeamId() }),
          },
        },
      );

      if (!response.ok) return;

      const result = await response.json();
      if (!result.data || !Array.isArray(result.data)) return;

      // 转换服务器历史记录格式
      const messages: TldrawAgentV3Message[] = [];
      for (const item of result.data) {
        if (item.role === 'user' && item.text) {
          messages.push({ role: 'user', content: item.text, timestamp: new Date(item.createdAt).getTime() });
        } else if (item.role === 'assistant' && item.text) {
          messages.push({ role: 'assistant', content: item.text, timestamp: new Date(item.createdAt).getTime() });
        }
      }

      // 按时间排序
      messages.sort((a, b) => a.timestamp - b.timestamp);

      // 更新历史记录
      historyMapRef.current.set(bid, messages);
      if (bid === boardId) {
        setHistory(messages);
      }
    } catch (error) {
      console.warn('Failed to load history:', error);
    }
  };

  const agentApi = useMemo(() => {
    if (!editor) return null;

    const push = (role: 'user' | 'assistant' | 'system', content: string) => {
      const newMessage = { role, content, timestamp: Date.now() };
      setHistory((h) => {
        const updated = [...h, newMessage];
        // 同步更新到 Map 中（如果有 boardId）
        if (boardId) {
          historyMapRef.current.set(boardId, updated);
        }
        return updated;
      });
    };

    const resolveServerBase = async (): Promise<string | null> => {
      // 与其他 API 一致，固定同源 /api，避免受 configs.serverUrl 影响
      if (!serverBaseRef.current) {
        serverBaseRef.current = '/api';
      }
      return serverBaseRef.current;
    };

    const generateSessionId = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

    const buildSnapshot = (): CanvasSnapshot => {
      if (!editor) return { nodes: [], selectionIds: [], viewport: null };
      try {
        const viewport = editor.getViewportPageBounds();
        const selectionIds = editor.getSelectedShapeIds().map((id) => id.replace('shape:', ''));
        const shapes = editor
          .getCurrentPageShapes()
          .slice(0, 100)
          .map((shape) => ({
            id: shape.id.replace('shape:', ''),
            type: shape.type,
            x: shape.x,
            y: shape.y,
            w: (shape as any).w || 0,
            h: (shape as any).h || 0,
            props: shape.props,
          }));
        return { nodes: shapes, viewport, selectionIds };
      } catch {
        return { nodes: [], selectionIds: [], viewport: null };
      }
    };

    const request = async (input: { message: string; boardId?: string; modelId?: string }): Promise<string> => {
      const reqBoardId = input.boardId || boardId || 'default-board';
      push('user', input.message);

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
              newHistory[streamingIdxRef.current] = { ...newHistory[streamingIdxRef.current], content: message };
            } else {
              newHistory[streamingIdxRef.current] = {
                ...newHistory[streamingIdxRef.current],
                content: newHistory[streamingIdxRef.current].content + message,
              };
            }
          }
          // 同步更新到 Map 中
          if (reqBoardId) {
            historyMapRef.current.set(reqBoardId, newHistory);
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

        // 为每个 boardId 维护独立的 sessionId
        let sessionId = sessionIdMapRef.current.get(reqBoardId);
        if (!sessionId) {
          sessionId = generateSessionId();
          sessionIdMapRef.current.set(reqBoardId, sessionId);
        }

        setHistory((h) => {
          streamingIdxRef.current = h.length;
          setIsStreaming(true);
          const newHistory = [...h, { role: 'assistant' as const, content: '', timestamp: Date.now() }];
          // 同步更新到 Map 中
          if (reqBoardId) {
            historyMapRef.current.set(reqBoardId, newHistory);
          }
          return newHistory;
        });

        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch(`${base}/tldraw-agent-v3/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getVinesToken() && { Authorization: `Bearer ${getVinesToken()}` }),
            ...(getVinesTeamId() && { 'x-monkeys-teamid': getVinesTeamId() }),
          },
          body: JSON.stringify({
            boardId: reqBoardId,
            sessionId,
            modelId: input.modelId,
            message: input.message,
            canvasSnapshot: buildSnapshot(),
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

        let doneStreaming = false;
        while (!doneStreaming) {
          if (controller.signal.aborted) throw new Error('aborted');

          const { done, value } = await reader.read();
          if (done) {
            doneStreaming = true;
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          let index;
          while ((index = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, index);
            buffer = buffer.slice(index + 2);
            if (!chunk.trim()) continue;

            let dataStr = '';
            for (const ln of chunk.split('\n')) {
              if (ln.startsWith('data:')) dataStr += ln.slice(5).trim();
            }
            if (!dataStr) continue;
            try {
              const json = JSON.parse(dataStr);

              if (json.type === 'tool_call' && json.tool_name) {
                applyToolCall(editor, json.tool_name, json.tool_input);
              }

              if (json.type === 'content_delta' && json.delta) {
                upsertAssistantMessage(json.delta);
              } else if (json.type === 'content_done') {
                // noop
              } else if (json.type === 'error') {
                upsertAssistantMessage(`错误：${json.error_message || json.error_code}`, true);
              }
            } catch {
              upsertAssistantMessage(dataStr);
            }
          }
        }

        finalize();
        return '已发送到 Agent V3（流式）';
      } catch (error) {
        const message = (error as Error)?.message;
        if (message === 'aborted') {
          upsertAssistantMessage('任务已取消', true);
        } else {
          upsertAssistantMessage(`错误：${message || '处理失败'}`, true);
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
      const emptyHistory: TldrawAgentV3Message[] = [];
      setHistory(emptyHistory);
      setIsStreaming(false);
      // 清空当前画板的 sessionId 和历史记录
      if (boardId) {
        sessionIdMapRef.current.delete(boardId);
        historyMapRef.current.set(boardId, emptyHistory);
        loadedBoardsRef.current.delete(boardId);
      }
    };

    return { history, isStreaming, push, request, cancel, reset };
  }, [editor, history, isStreaming, boardId]);

  return agentApi;
}
