import { useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Editor } from 'tldraw'

export type AgentInput = {
  message: string
  bounds?: { x: number; y: number; w: number; h: number }
  modelName?: string
}

type AgentVisualContext = {
  viewport: { x: number; y: number; w: number; h: number } | null
  selectionIds: string[]
  shapes: Array<{ id: string; type: string; x?: number; y?: number; w?: number; h?: number }>
  simpleShapes?: Array<Record<string, any>>
  screenshot?: string | null
  chatHistory?: { role: string; content: string }[]
}

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
   | { _type: 'pen_draw'; points: Array<{ x: number; y: number }>; color?: string; size?: number }

function applyAgentAction(editor: Editor, action: AgentAction) {
  try {
    switch (action._type) {
      case 'create_shape':
        // 支持两种格式：{shape: {...}} 或直接 {type, x, y, props}
        const shapeData = action.shape || { type: action.type, x: action.x, y: action.y, props: action.props }
        console.log('[DEBUG] create_shape:', shapeData)
        editor.createShape(shapeData)
        return
      case 'update_shape':
        editor.updateShapes([{ id: action.id as any, type: undefined as any, props: action.props } as any])
        return
      case 'delete_shapes':
        editor.deleteShapes(action.ids as any)
        return
      case 'select_shapes':
        editor.select(action.ids as any)
        return
      case 'align': {
        const bounds: any = (editor as any).getSelectionPageBounds?.()
        const ids = editor.getSelectedShapeIds() as any
        if (!bounds || !ids?.length) return
        const updates: any[] = []
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id)
          if (!s) continue
          if (action.mode === 'left') updates.push({ id, type: s.type, x: bounds.x })
          if (action.mode === 'right') updates.push({ id, type: s.type, x: bounds.x + bounds.w - (s.props?.w ?? 0) })
          if (action.mode === 'top') updates.push({ id, type: s.type, y: bounds.y })
          if (action.mode === 'bottom') updates.push({ id, type: s.type, y: bounds.y + bounds.h - (s.props?.h ?? 0) })
          if (action.mode === 'center-x') updates.push({ id, type: s.type, x: bounds.x + bounds.w / 2 - (s.props?.w ?? 0) / 2 })
          if (action.mode === 'center-y') updates.push({ id, type: s.type, y: bounds.y + bounds.h / 2 - (s.props?.h ?? 0) / 2 })
        }
        if (updates.length) (editor as any).updateShapes(updates)
        return
      }
      case 'distribute': {
        // 简化分布：按选择顺序在包围盒内平均分布
        const ids = editor.getSelectedShapeIds() as any
        if (!ids?.length) return
        const bounds: any = (editor as any).getSelectionPageBounds?.()
        if (!bounds) return
        const shapes: any[] = ids.map((id: any) => (editor as any).getShape?.(id)).filter(Boolean)
        const count = shapes.length
        if (count < 3) return
        if (action.mode === 'horizontal') {
          const totalW = shapes.reduce((s, sh) => s + (sh.props?.w ?? 0), 0)
          const gap = (bounds.w - totalW) / (count - 1)
          let cursor = bounds.x
          const updates = shapes.map((sh) => {
            const u = { id: sh.id, type: sh.type, x: cursor }
            cursor += (sh.props?.w ?? 0) + gap
            return u
          })
          ;(editor as any).updateShapes(updates)
        } else {
          const totalH = shapes.reduce((s, sh) => s + (sh.props?.h ?? 0), 0)
          const gap = (bounds.h - totalH) / (count - 1)
          let cursor = bounds.y
          const updates = shapes.map((sh) => {
            const u = { id: sh.id, type: sh.type, y: cursor }
            cursor += (sh.props?.h ?? 0) + gap
            return u
          })
          ;(editor as any).updateShapes(updates)
        }
        return
      }
      case 'reorder': {
        const ids = action.ids as any
        if (!ids?.length) return
        if (action.direction === 'to-front') (editor as any).bringToFront?.(ids)
        if (action.direction === 'to-back') (editor as any).sendToBack?.(ids)
        if (action.direction === 'forward') (editor as any).bringForward?.(ids)
        if (action.direction === 'backward') (editor as any).sendBackward?.(ids)
        return
      }
      case 'move': {
        const ids = action.ids as any
        if (!ids?.length) return
        const updates: any[] = []
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id)
          if (!s) continue
          updates.push({ id, type: s.type, x: (s.x ?? 0) + action.dx, y: (s.y ?? 0) + action.dy })
        }
        if (updates.length) (editor as any).updateShapes(updates)
        return
      }
      case 'rotate': {
        const ids = action.ids as any
        if (!ids?.length) return
        const updates: any[] = []
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id)
          if (!s) continue
          const rotation = (s.rotation ?? 0) + action.angle
          updates.push({ id, type: s.type, rotation })
        }
        if (updates.length) (editor as any).updateShapes(updates)
        return
      }
      case 'resize': {
        const ids = action.ids as any
        if (!ids?.length) return
        const updates: any[] = []
        for (const id of ids) {
          const s: any = (editor as any).getShape?.(id)
          if (!s) continue
          const currW = s.props?.w ?? 0
          const currH = s.props?.h ?? 0
          const w = action.w ?? (action.scaleX ? currW * (action.scaleX || 1) : currW)
          const h = action.h ?? (action.scaleY ? currH * (action.scaleY || 1) : currH)
          updates.push({ id, type: s.type, props: { ...s.props, w, h } })
        }
        if (updates.length) (editor as any).updateShapes(updates)
        return
      }
      case 'pen_draw': {
        const pts = action.points?.map((p) => ({ x: p.x, y: p.y })) || []
        if (!pts.length) return
        ;(editor as any).createShape?.({ type: 'draw', x: pts[0].x, y: pts[0].y, props: { points: pts, color: action.color, size: action.size } })
        return
      }
      case 'viewport_move': {
        const b = { x: action.x, y: action.y, w: action.w ?? 800, h: action.h ?? 600 }
        ;(editor as any).zoomToBounds?.(b, { inset: 64 })
        return
      }
      default:
        return
    }
  } catch {}
}

export type AgentAPI = {
  prompt: (input: string | AgentInput) => Promise<string>
  request: (input: AgentInput) => Promise<string>
  cancel: () => void
  reset: () => void
  history: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: number }[]
  isStreaming: boolean
}

export function useTldrawAgent(editor: Editor | null): AgentAPI | null {
  const [history, setHistory] = useState<AgentAPI['history']>([])
  const abortRef = useRef<AbortController | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const streamingIdxRef = useRef<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  return useMemo<AgentAPI | null>(() => {
    if (!editor) return null

    const push = (role: 'user' | 'assistant' | 'system', content: string) =>
      setHistory((h) => [...h, { role, content, timestamp: Date.now() }])

    const connectSocket = async () => {
      if (socketRef.current?.connected) return socketRef.current
      
      // 从后端配置获取服务器地址
      let base = '' // 默认值
      try {
        const response = await fetch('/api/configs')
        const data = await response.json()
        const serverUrl = data?.data?.endpoints?.serverUrl
        if (serverUrl) {
          base = String(serverUrl).replace(/\/$/, '')
        }
      } catch (e) {
        console.warn('Failed to get server config, using default:', e)
      }
      
      if (!base) {
        throw new Error('无法获取服务器地址')
      }
      // base = 'http://127.0.0.1:33002'
      const url = `${base}/tldraw-agent`
      const s = io(url, { transports: ['websocket'], withCredentials: true })
      socketRef.current = s

      // 忽略 info 系统提示，不显示到对话列表
      s.on('info', (_payload: { message: string }) => {})
      s.on('delta', (payload: { content?: string; action?: AgentAction }) => {
        setIsStreaming(true)
        if (!payload?.content && !payload?.action) return
        if (payload?.content) {
          const content = payload.content as string
          setHistory((h) => {
            // 将增量合并到最新的流式 assistant 消息
            const idx = streamingIdxRef.current
            if (idx == null || idx < 0 || idx >= h.length || h[idx]?.role !== 'assistant') {
              return [...h, { role: 'assistant', content, timestamp: Date.now() }]
            }
            const next = h.slice()
            const prev = next[idx]
            next[idx] = { ...prev, content: (prev.content || '') + content, timestamp: Date.now() }
            return next
          })
        }
        if (payload.action) applyAgentAction(editor, payload.action)
      })
      s.on('done', (_payload: { message: string }) => {
        streamingIdxRef.current = null
        setIsStreaming(false)
      })
      s.on('error', (payload: { message: string }) => {
        streamingIdxRef.current = null
        setIsStreaming(false)
        setHistory((h) => [...h, { role: 'assistant', content: payload.message, timestamp: Date.now() }])
      })

      return s
    }

    const toSimpleShape = (s: any): Record<string, any> => {
      const type = String(s?.type ?? '')
      const id = String(s?.id ?? '')
      const w = typeof s?.props?.w === 'number' ? s.props.w : undefined
      const h = typeof s?.props?.h === 'number' ? s.props.h : undefined
      const base: Record<string, any> = { _type: type, shapeId: id, x: s?.x, y: s?.y, w, h, note: (s?.meta?.note as string) || '' }
      if (type === 'text') base.text = s?.props?.text
      if (type === 'arrow') base.end = s?.props?.end
      if (type === 'line' || type === 'draw') base.points = s?.props?.points?.length
      if (type === 'geo') base.geo = s?.props?.geo
      return base
    }

    const captureViewportImage = async (): Promise<string | null> => {
      try {
        const svgString = await (editor as any)?.getSvgString?.()
        if (typeof svgString === 'string' && svgString.length > 0) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          return url
        }
      } catch {}
      return null
    }

    const getVisualContext = (): AgentVisualContext => {
      try {
        const viewportBounds = (editor as any).getViewportPageBounds?.() ?? null
        const selectionIds = (editor.getSelectedShapeIds?.() ?? []) as string[]
        const shapes = (editor.getCurrentPageShapes?.() ?? []) as any[]
        const simplified = shapes.map((s) => ({
          id: String(s?.id ?? ''),
          type: String(s?.type ?? ''),
          x: typeof s?.x === 'number' ? s.x : undefined,
          y: typeof s?.y === 'number' ? s.y : undefined,
          w: typeof s?.props?.w === 'number' ? s.props.w : undefined,
          h: typeof s?.props?.h === 'number' ? s.props.h : undefined,
        }))
        const simpleShapes = shapes.map(toSimpleShape)
        const chatHistory = history.slice(-10).map((m) => ({ role: m.role, content: m.content }))
        return {
          viewport: viewportBounds
            ? { x: viewportBounds.x, y: viewportBounds.y, w: viewportBounds.w, h: viewportBounds.h }
            : null,
          selectionIds,
          shapes: simplified,
          simpleShapes,
          screenshot: null,
          chatHistory,
        }
      } catch {
        return { viewport: null, selectionIds: [], shapes: [], simpleShapes: [], screenshot: null, chatHistory: [] }
      }
    }

    const request = async (input: AgentInput): Promise<string> => {
      // 先把用户消息即时追加到历史
      push('user', input.message)
      try {
        const s = await connectSocket()
        const send = async () => {
          const context = getVisualContext()
          // 异步补充截图（可选）
          context.screenshot = await captureViewportImage()
          s.emit('prompt', { ...input, context })
          // 创建一个占位的 assistant 流式消息
          setHistory((h) => {
            streamingIdxRef.current = h.length
            setIsStreaming(true)
            return [...h, { role: 'assistant', content: '', timestamp: Date.now() }]
          })
        }
        if (s && s.connected) {
          await send()
          return '已发送到 Agent（流式）'
        }
        if (s) {
          await new Promise<void>((resolve) => {
            const onConnect = () => {
              s.off('connect_error', onError)
              send()
              resolve()
            }
            const onError = () => {
              s.off('connect', onConnect)
              resolve()
            }
            s.once('connect', onConnect)
            s.once('connect_error', onError)
          })
          if (s.connected) {
            return '已发送到 Agent（流式）'
          }
        }
        const msg = 'WebSocket 未连接，无法发送请求'
        push('assistant', msg)
        return msg
      } catch (e: any) {
        const msg = e?.name === 'AbortError' ? '已取消' : '请求失败'
        push('assistant', msg)
        return msg
      }
    }

    const prompt = async (input: string | AgentInput) => {
      const normalized: AgentInput = typeof input === 'string' ? { message: input } : input
      return request(normalized)
    }

    const cancel = () => {
      abortRef.current?.abort()
      socketRef.current?.emit('cancel')
    }

    const reset = () => {
      setHistory([])
      abortRef.current?.abort()
      socketRef.current?.emit('reset')
    }

    return { prompt, request, cancel, reset, history, isStreaming }
  }, [editor, history, isStreaming])
}


