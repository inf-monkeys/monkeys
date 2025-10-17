import { useEffect, useMemo, useRef, useState } from 'react';

import { createShapeId, type Editor } from 'tldraw';

export type AgentInput = {
  message: string;
  bounds?: { x: number; y: number; w: number; h: number };
  modelName?: string;
};

type AgentVisualContext = {
  viewport: { x: number; y: number; w: number; h: number } | null;
  selectionIds: string[];
  shapes: Array<{ id: string; type: string; x?: number; y?: number; w?: number; h?: number }>;
  simpleShapes?: Array<Record<string, any>>;
  screenshot?: string | null;
  chatHistory?: { role: string; content: string }[];
};

type AgentAction =
  | { _type: 'create_shape'; shape?: any; type?: string; x?: number; y?: number; props?: any }
  | { _type: 'update_shape'; id: string; props: any }
  | { _type: 'delete_shapes'; ids: string[] }
  | { _type: 'select_shapes'; ids: string[] }
  | { _type: 'align'; mode: 'left' | 'right' | 'top' | 'bottom' | 'center-x' | 'center-y' }
  | { _type: 'distribute'; mode: 'horizontal' | 'vertical' }
  | { _type: 'reorder'; ids: string[]; direction: 'to-front' | 'to-back' | 'forward' | 'backward' }
  | { _type: 'viewport_move'; x: number; y: number; w?: number; h?: number }
  | { _type: 'move'; ids: string[]; dx: number; dy: number }
  | { _type: 'rotate'; ids: string[]; angle: number }
  | { _type: 'resize'; ids: string[]; scaleX?: number; scaleY?: number; w?: number; h?: number }
  | { _type: 'pen_draw'; points: Array<{ x: number; y: number }>; color?: string; size?: number };

type PenPoint = { x: number; y: number };
type FreeSegmentPoint = { x: number; y: number; z: number };
type FreeSegment = { type: 'free'; points: FreeSegmentPoint[] };

const DRAW_COLOR_ALLOWED = new Set(['black', 'grey', 'red', 'orange', 'yellow', 'green', 'blue', 'cyan']);
const DRAW_COLOR_ALIASES: Record<string, string> = {
  '#000': 'black',
  '#000000': 'black',
  '#fff': 'grey',
  '#ffffff': 'grey',
  '#ff0000': 'red',
  '#ff4d4d': 'red',
  '#ff4500': 'orange',
  '#ffa500': 'orange',
  '#ffff00': 'yellow',
  '#ffd700': 'yellow',
  '#00ff00': 'green',
  '#008000': 'green',
  '#0000ff': 'blue',
  '#1e90ff': 'blue',
  '#00ffff': 'cyan',
  '#008b8b': 'cyan',
  white: 'grey',
  gray: 'grey',
  purple: 'blue',
  violet: 'blue',
  teal: 'cyan',
  navy: 'blue',
  turquoise: 'cyan',
  pink: 'red',
};
const MAX_DRAW_SEGMENT_POINTS = 600;
const MIN_POINT_DISTANCE = 0.1;
const FUNCTION_CALL_OPEN_PREFIX = '<function_calls';
const FUNCTION_CALL_OPEN = '<function_calls>';
const FUNCTION_CALL_CLOSE = '</function_calls>';

function parseFunctionCallValue(raw: string): any {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (!Number.isNaN(Number(trimmed))) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch {}
  }
  return trimmed;
}

function parseFunctionCalls(xml: string): AgentAction[] {
  const actions: AgentAction[] = [];
  const invokeRe = /<invoke\s+name="([^"]+)"\s*>([\s\S]*?)(?:<\/invoke>|$)/gi;
  let match: RegExpExecArray | null;
  while ((match = invokeRe.exec(xml))) {
    const [, name, body] = match;
    const params: Record<string, any> = {};
    const paramRe = /<parameter\s+name="([^"]+)">([\s\S]*?)<\/parameter>/gi;
    let pm: RegExpExecArray | null;
    while ((pm = paramRe.exec(body))) {
      const [, paramName, rawValue] = pm;
      params[paramName] = parseFunctionCallValue(rawValue);
    }
    if (name) {
      actions.push({ _type: name, ...(params as any) } as AgentAction);
    }
  }
  return actions;
}

function normalizeStrokeColor(raw?: string): string {
  if (!raw) return 'black';
  const key = raw.trim().toLowerCase();
  const alias = DRAW_COLOR_ALIASES[key];
  if (alias && DRAW_COLOR_ALLOWED.has(alias)) return alias;
  if (DRAW_COLOR_ALLOWED.has(key)) return key;
  return 'black';
}

function normalizeStrokeSize(raw?: number | string): 's' | 'm' | 'l' {
  if (typeof raw === 'string') {
    const key = raw.trim().toLowerCase();
    if (key === 's' || key === 'small' || key === 'thin') return 's';
    if (key === 'l' || key === 'xl' || key === 'large' || key === 'thick') return 'l';
    if (key === 'm' || key === 'medium') return 'm';
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw <= 1.25) return 's';
    if (raw >= 3) return 'l';
    return 'm';
  }
  return 'm';
}

function sanitizePenPoints(points: PenPoint[]): PenPoint[] {
  const filtered: PenPoint[] = [];
  for (const pt of points) {
    const x = Number(pt?.x);
    const y = Number(pt?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (!filtered.length) {
      filtered.push({ x, y });
      continue;
    }
    const last = filtered[filtered.length - 1];
    if (Math.hypot(x - last.x, y - last.y) >= MIN_POINT_DISTANCE) {
      filtered.push({ x, y });
    }
  }
  if (!filtered.length) return filtered;
  if (filtered.length <= MAX_DRAW_SEGMENT_POINTS) return filtered;

  const result: PenPoint[] = [];
  const step = (filtered.length - 1) / (MAX_DRAW_SEGMENT_POINTS - 1);
  for (let i = 0; i < MAX_DRAW_SEGMENT_POINTS; i++) {
    const idx = Math.round(i * step);
    result.push(filtered[idx]);
  }
  return result;
}

function preparePenStroke(points: PenPoint[]): { origin: PenPoint; segment: FreeSegment } | null {
  const cleaned = sanitizePenPoints(points);
  if (!cleaned.length) return null;

  const base = cleaned[0];
  const origin = {
    x: Number(base.x.toFixed(2)),
    y: Number(base.y.toFixed(2)),
  };

  const segmentPoints: FreeSegmentPoint[] = cleaned.map((pt) => ({
    x: Number((pt.x - base.x).toFixed(2)),
    y: Number((pt.y - base.y).toFixed(2)),
    z: 0.5,
  }));

  if (segmentPoints.length === 1) {
    segmentPoints.push({ x: 0.1, y: 0.1, z: 0.5 });
  }

  return {
    origin,
    segment: { type: 'free', points: segmentPoints },
  };
}

function ensureShapeId(editor: Editor): string {
  const tldrawEditor: any = editor;
  if (typeof tldrawEditor.createShapeId === 'function') {
    try {
      const id = tldrawEditor.createShapeId();
      if (id) return id;
    } catch {}
  }
  return createShapeId();
}

function applyAgentAction(editor: Editor, action: AgentAction) {
  try {
    switch (action._type) {
      case 'create_shape':
        // 支持两种格式：{shape: {...}} 或直接 {type, x, y, props}
        const baseShape = action.shape || { type: action.type, x: action.x, y: action.y, props: action.props };
        if (!baseShape) return;
        const shapeWithId = {
          id: baseShape.id ?? ensureShapeId(editor),
          ...baseShape,
        };
        if (typeof (editor as any).createShapes === 'function') {
          (editor as any).createShapes([shapeWithId]);
        } else {
          editor.createShape(shapeWithId as any);
        }
        return;
      case 'update_shape':
        editor.updateShapes([{ id: action.id as any, type: undefined as any, props: action.props } as any]);
        return;
      case 'delete_shapes':
        editor.deleteShapes(action.ids as any);
        return;
      case 'select_shapes':
        if (!Array.isArray(action.ids)) return;
        {
          const ids = action.ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
          if (!ids.length) return;
          editor.select(...(ids as any));
        }
        return;
      case 'align': {
        const bounds: any = (editor as any).getSelectionPageBounds?.();
        const ids = editor.getSelectedShapeIds() as any;
        if (!bounds || !ids?.length) return;
        const updates: any[] = [];
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id);
          if (!s) continue;
          if (action.mode === 'left') updates.push({ id, type: s.type, x: bounds.x });
          if (action.mode === 'right') updates.push({ id, type: s.type, x: bounds.x + bounds.w - (s.props?.w ?? 0) });
          if (action.mode === 'top') updates.push({ id, type: s.type, y: bounds.y });
          if (action.mode === 'bottom') updates.push({ id, type: s.type, y: bounds.y + bounds.h - (s.props?.h ?? 0) });
          if (action.mode === 'center-x')
            updates.push({ id, type: s.type, x: bounds.x + bounds.w / 2 - (s.props?.w ?? 0) / 2 });
          if (action.mode === 'center-y')
            updates.push({ id, type: s.type, y: bounds.y + bounds.h / 2 - (s.props?.h ?? 0) / 2 });
        }
        if (updates.length) (editor as any).updateShapes(updates);
        return;
      }
      case 'distribute': {
        // 简化分布：按选择顺序在包围盒内平均分布
        const ids = editor.getSelectedShapeIds() as any;
        if (!ids?.length) return;
        const bounds: any = (editor as any).getSelectionPageBounds?.();
        if (!bounds) return;
        const shapes: any[] = ids.map((id: any) => (editor as any).getShape?.(id)).filter(Boolean);
        const count = shapes.length;
        if (count < 3) return;
        if (action.mode === 'horizontal') {
          const totalW = shapes.reduce((s, sh) => s + (sh.props?.w ?? 0), 0);
          const gap = (bounds.w - totalW) / (count - 1);
          let cursor = bounds.x;
          const updates = shapes.map((sh) => {
            const u = { id: sh.id, type: sh.type, x: cursor };
            cursor += (sh.props?.w ?? 0) + gap;
            return u;
          });
          (editor as any).updateShapes(updates);
        } else {
          const totalH = shapes.reduce((s, sh) => s + (sh.props?.h ?? 0), 0);
          const gap = (bounds.h - totalH) / (count - 1);
          let cursor = bounds.y;
          const updates = shapes.map((sh) => {
            const u = { id: sh.id, type: sh.type, y: cursor };
            cursor += (sh.props?.h ?? 0) + gap;
            return u;
          });
          (editor as any).updateShapes(updates);
        }
        return;
      }
      case 'reorder': {
        const ids = action.ids as any;
        if (!ids?.length) return;
        if (action.direction === 'to-front') (editor as any).bringToFront?.(ids);
        if (action.direction === 'to-back') (editor as any).sendToBack?.(ids);
        if (action.direction === 'forward') (editor as any).bringForward?.(ids);
        if (action.direction === 'backward') (editor as any).sendBackward?.(ids);
        return;
      }
      case 'move': {
        const ids = action.ids as any;
        if (!ids?.length) return;
        const updates: any[] = [];
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id);
          if (!s) continue;
          updates.push({ id, type: s.type, x: (s.x ?? 0) + action.dx, y: (s.y ?? 0) + action.dy });
        }
        if (updates.length) (editor as any).updateShapes(updates);
        return;
      }
      case 'rotate': {
        const ids = action.ids as any;
        if (!ids?.length) return;
        const updates: any[] = [];
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id);
          if (!s) continue;
          const rotation = (s.rotation ?? 0) + action.angle;
          updates.push({ id, type: s.type, rotation });
        }
        if (updates.length) (editor as any).updateShapes(updates);
        return;
      }
      case 'resize': {
        const ids = action.ids as any;
        if (!ids?.length) return;
        const updates: any[] = [];
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id);
          if (!s) continue;
          const currW = s.props?.w ?? 0;
          const currH = s.props?.h ?? 0;
          const w = action.w ?? (action.scaleX ? currW * (action.scaleX || 1) : currW);
          const h = action.h ?? (action.scaleY ? currH * (action.scaleY || 1) : currH);
          updates.push({ id, type: s.type, props: { ...s.props, w, h } });
        }
        if (updates.length) (editor as any).updateShapes(updates);
        return;
      }
      case 'pen_draw': {
        const prepared = preparePenStroke(action.points ?? []);
        if (!prepared) return;

        const color = normalizeStrokeColor(action.color);
        const size = normalizeStrokeSize(action.size);

        const shapeId =
          typeof (editor as any).createShapeId === 'function' ? (editor as any).createShapeId() : createShapeId();

        const shape = {
          id: shapeId,
          type: 'draw',
          x: prepared.origin.x,
          y: prepared.origin.y,
          props: {
            segments: [prepared.segment],
            color,
            size,
            isComplete: true,
            isPen: true,
            dash: 'draw',
            fill: 'none',
            scale: 1,
          },
        };

        if (typeof (editor as any).createShapes === 'function') {
          (editor as any).createShapes([shape]);
        } else {
          (editor as any).createShape?.(shape);
        }
        return;
      }
      case 'viewport_move': {
        const b = { x: action.x, y: action.y, w: action.w ?? 800, h: action.h ?? 600 };
        (editor as any).zoomToBounds?.(b, { inset: 64 });
        return;
      }
      default:
        return;
    }
  } catch (error) {
    // suppress unexpected action errors
  }
}

export type AgentAPI = {
  prompt: (input: string | AgentInput) => Promise<string>;
  request: (input: AgentInput) => Promise<string>;
  cancel: () => void;
  reset: () => void;
  history: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[];
  isStreaming: boolean;
};

export function useTldrawAgent(editor: Editor | null): AgentAPI | null {
  const [history, setHistory] = useState<AgentAPI['history']>([]);
  const abortRef = useRef<AbortController | null>(null);
  const streamingIdxRef = useRef<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const serverBaseRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const historyRef = useRef(history);
  const skipFunctionBlockRef = useRef(false);
  const functionBlockBufferRef = useRef('');

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
        // const serverUrl = 'http://localhost:22052/api'

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

    const toSimpleShape = (s: any): Record<string, any> => {
      const type = String(s?.type ?? '');
      const id = String(s?.id ?? '');
      const w = typeof s?.props?.w === 'number' ? s.props.w : undefined;
      const h = typeof s?.props?.h === 'number' ? s.props.h : undefined;
      const base: Record<string, any> = {
        _type: type,
        shapeId: id,
        x: s?.x,
        y: s?.y,
        w,
        h,
        note: (s?.meta?.note as string) || '',
      };
      if (type === 'text') base.text = s?.props?.text;
      if (type === 'arrow') base.end = s?.props?.end;
      if (type === 'line' || type === 'draw') base.points = s?.props?.points?.length;
      if (type === 'geo') base.geo = s?.props?.geo;
      return base;
    };

    const captureViewportImage = async (): Promise<string | null> => {
      try {
        const svgString = await (editor as any)?.getSvgString?.();
        if (typeof svgString === 'string' && svgString.length > 0) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          return url;
        }
      } catch {}
      return null;
    };

    const getVisualContext = (): AgentVisualContext => {
      try {
        const viewportBounds = (editor as any).getViewportPageBounds?.() ?? null;
        const selectionIds = (editor.getSelectedShapeIds?.() ?? []) as string[];
        const shapes = (editor.getCurrentPageShapes?.() ?? []) as any[];
        const simplified = shapes.map((s) => ({
          id: String(s?.id ?? ''),
          type: String(s?.type ?? ''),
          x: typeof s?.x === 'number' ? s.x : undefined,
          y: typeof s?.y === 'number' ? s.y : undefined,
          w: typeof s?.props?.w === 'number' ? s.props.w : undefined,
          h: typeof s?.props?.h === 'number' ? s.props.h : undefined,
        }));
        const simpleShapes = shapes.map(toSimpleShape);
        const chatHistory = historyRef.current.slice(-10).map((m) => ({ role: m.role, content: m.content }));
        return {
          viewport: viewportBounds
            ? { x: viewportBounds.x, y: viewportBounds.y, w: viewportBounds.w, h: viewportBounds.h }
            : null,
          selectionIds,
          shapes: simplified,
          simpleShapes,
          screenshot: null,
          chatHistory,
        };
      } catch {
        return { viewport: null, selectionIds: [], shapes: [], simpleShapes: [], screenshot: null, chatHistory: [] };
      }
    };

    const request = async (input: AgentInput): Promise<string> => {
      push('user', input.message);
      let resultMessage = '已发送到 Agent（流式）';

      const finalize = () => {
        streamingIdxRef.current = null;
        setIsStreaming(false);
        abortRef.current = null;
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
        context.screenshot = await captureViewportImage();

        const sessionId = generateSessionId();
        sessionIdRef.current = sessionId;
        skipFunctionBlockRef.current = false;
        functionBlockBufferRef.current = '';

        setHistory((h) => {
          streamingIdxRef.current = h.length;
          setIsStreaming(true);
          return [...h, { role: 'assistant' as const, content: '', timestamp: Date.now() }];
        });

        const controller = new AbortController();
        abortRef.current = controller;

        const response = await fetch(`${base}/tldraw-agent/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ...input, context, sessionId }),
          signal: controller.signal,
        });

        const upsertAssistantMessage = (message: string, options?: { append?: boolean; newline?: boolean }) => {
          const { append = false, newline = true } = options ?? {};
          setHistory((h) => {
            const idx = streamingIdxRef.current;
            if (idx == null || idx < 0 || idx >= h.length || h[idx]?.role !== 'assistant') {
              return [...h, { role: 'assistant' as const, content: message, timestamp: Date.now() }];
            }
            const next = h.slice();
            const prev = next[idx];
            const prevContent = prev.content || '';
            const content = append ? prevContent + (prevContent && newline ? '\n' : '') + message : message;
            next[idx] = { ...prev, content, timestamp: Date.now() };
            return next;
          });
        };

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => '');
          const failure = `请求失败：${text || response.statusText}`;
          setHistory((h) => [...h, { role: 'assistant' as const, content: failure, timestamp: Date.now() }]);
          finalize();
          sessionIdRef.current = null;
          return failure;
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let stopped = false;

        const appendAssistantContent = (chunk: string) => {
          if (!chunk) return;

          const actions: AgentAction[] = [];
          const data = skipFunctionBlockRef.current ? functionBlockBufferRef.current + chunk : chunk;
          skipFunctionBlockRef.current = false;
          functionBlockBufferRef.current = '';

          let textPortion = '';
          let cursor = 0;

          while (cursor < data.length) {
            const openIdx = data.indexOf(FUNCTION_CALL_OPEN_PREFIX, cursor);
            if (openIdx === -1) {
              const partialIdx = data.indexOf('<function', cursor);
              if (partialIdx !== -1) {
                textPortion += data.slice(cursor, partialIdx);
                skipFunctionBlockRef.current = true;
                functionBlockBufferRef.current = data.slice(partialIdx);
              } else {
                textPortion += data.slice(cursor);
              }
              break;
            }

            // text before the function call
            textPortion += data.slice(cursor, openIdx);

            // we have detected the start of <function_calls...
            const gtIdx = data.indexOf('>', openIdx);
            if (gtIdx === -1) {
              skipFunctionBlockRef.current = true;
              functionBlockBufferRef.current = data.slice(openIdx);
              break;
            }

            const closeIdx = data.indexOf(FUNCTION_CALL_CLOSE, gtIdx + 1);
            if (closeIdx === -1) {
              skipFunctionBlockRef.current = true;
              functionBlockBufferRef.current = data.slice(openIdx);
              break;
            }

            const inner = data.slice(gtIdx + 1, closeIdx);
            const parsed = parseFunctionCalls(inner);
            if (parsed.length) actions.push(...parsed);

            cursor = closeIdx + FUNCTION_CALL_CLOSE.length;
          }

          if (actions.length) actions.forEach((action) => applyAgentAction(editor, action));

          const sanitized = textPortion.replace(/\s+$/, '');
          if (!sanitized) return;
          upsertAssistantMessage(sanitized, { append: true, newline: false });
        };

        const flushFunctionBuffer = () => {
          if (functionBlockBufferRef.current) {
            let pending = functionBlockBufferRef.current;
            if (!pending.includes(FUNCTION_CALL_CLOSE)) {
              pending += FUNCTION_CALL_CLOSE;
            }
            const gtIdx = pending.indexOf('>');
            const closeIdx = pending.indexOf(FUNCTION_CALL_CLOSE, gtIdx + 1);
            let parsed: AgentAction[] = [];
            if (gtIdx !== -1 && closeIdx !== -1 && closeIdx > gtIdx) {
              const inner = pending.slice(gtIdx + 1, closeIdx);
              parsed = parseFunctionCalls(inner);
            }
            if (parsed.length) parsed.forEach((action) => applyAgentAction(editor, action));
            functionBlockBufferRef.current = '';
            skipFunctionBlockRef.current = false;
          }
        };

        const handleDone = () => {
          flushFunctionBuffer();
          streamingIdxRef.current = null;
          setIsStreaming(false);
        };

        const handleError = (message: string) => {
          resultMessage = message;
          upsertAssistantMessage(message, { append: true });
          stopped = true;
          handleDone();
        };

        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let delimiter;
          while ((delimiter = buffer.indexOf('\n\n')) !== -1) {
            const rawChunk = buffer.slice(0, delimiter);
            buffer = buffer.slice(delimiter + 2);
            if (!rawChunk) continue;

            const lines = rawChunk.split('\n');
            let eventName = 'message';
            const dataLines: string[] = [];
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                let valueLine = line.slice(5);
                if (valueLine.startsWith(' ')) valueLine = valueLine.slice(1);
                dataLines.push(valueLine);
              }
            }

            const dataRaw = dataLines.join('\n');
            let payload: any = undefined;
            if (dataRaw) {
              try {
                payload = JSON.parse(dataRaw);
              } catch {
                payload = dataRaw;
              }
            }

            switch (eventName) {
              case 'session_start':
                if (payload?.sessionId) {
                  sessionIdRef.current = payload.sessionId;
                }
                break;
              case 'info':
              case 'heartbeat':
                break;
              case 'delta':
                if (typeof payload?.content === 'string') {
                  appendAssistantContent(payload.content);
                }
                if (payload?.action) {
                  applyAgentAction(editor, payload.action as AgentAction);
                }
                break;
              case 'action':
                if (payload?.action) {
                  applyAgentAction(editor, payload.action as AgentAction);
                }
                break;
              case 'done':
                flushFunctionBuffer();
                handleDone();
                stopped = true;
                break;
              case 'error':
                handleError(typeof payload?.message === 'string' ? payload.message : '请求失败');
                break;
              default:
                if (typeof payload === 'string') {
                  appendAssistantContent(payload);
                } else if (payload?.content) {
                  appendAssistantContent(String(payload.content));
                }
            }

            if (stopped) break;
          }
        }

        sessionIdRef.current = null;
        flushFunctionBuffer();
        finalize();
        return resultMessage;
      } catch (e: any) {
        const aborted = e?.name === 'AbortError';
        finalize();
        if (aborted) {
          return '已取消';
        }
        const failure = '请求失败';
        sessionIdRef.current = null;
        setHistory((h) => [...h, { role: 'assistant' as const, content: failure, timestamp: Date.now() }]);
        return failure;
      } finally {
        if (readerRef.current) {
          try {
            await readerRef.current.cancel();
          } catch {}
        }
        readerRef.current = null;
      }
    };

    const prompt = async (input: string | AgentInput) => {
      const normalized: AgentInput = typeof input === 'string' ? { message: input } : input;
      return request(normalized);
    };

    const cancel = () => {
      abortRef.current?.abort();
      abortRef.current = null;
      if (readerRef.current) {
        readerRef.current.cancel().catch(() => undefined);
      }
      readerRef.current = null;
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      skipFunctionBlockRef.current = false;
      streamingIdxRef.current = null;
      setIsStreaming(false);
      if (sessionId) {
        resolveServerBase()
          .then((base) => {
            if (!base) return;
            return fetch(`${base}/tldraw-agent/cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ sessionId }),
            });
          })
          .catch(() => undefined);
      }
      functionBlockBufferRef.current = '';
    };

    const reset = () => {
      setHistory([]);
      cancel();
    };

    return { prompt, request, cancel, reset };
  }, [editor]);

  if (!editor || !agentApi) {
    return null;
  }

  return { ...agentApi, history, isStreaming };
}
