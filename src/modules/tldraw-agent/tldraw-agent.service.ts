import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';

export type TldrawAgentAction =
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

export type TldrawAgentRequestPayload = {
  message: string
  bounds?: { x: number; y: number; w: number; h: number }
  modelName?: string
  context?: any
}

type StreamCallbacks = {
  onInfo?: (message: string) => void
  onDelta?: (payload: { content?: string; action?: TldrawAgentAction }) => void
  onDone?: (message: string) => void
  onError?: (message: string) => void
}

@Injectable()
export class TldrawAgentService {
  private readonly logger = new Logger(TldrawAgentService.name)
  private readonly abortControllers = new Map<string, AbortController>()
  private readonly toolBuffers = new Map<string, Map<string, { name: string; jsonText: string }>>()

  async startStream(sessionId: string, body: TldrawAgentRequestPayload, callbacks: StreamCallbacks = {}) {
    this.logger.log(`[STREAM] start session ${sessionId}`)

    // Cancel previous session if it exists
    this.cancelSession(sessionId)

    const ac = new AbortController()
    this.abortControllers.set(sessionId, ac)
    this.toolBuffers.set(sessionId, new Map())

    let reportedError = false
    const reportError = (message: string) => {
      if (reportedError) return
      reportedError = true
      callbacks.onError?.(message)
    }

    try {
      const baseUrl = (config.agentv2?.openaiCompatible?.url || '').replace(/\/$/, '')
      const apiKey = config.agentv2?.openaiCompatible?.apiKey
      const model = body.modelName || 'claude-sonnet-4-20250514-thinking'

      if (!baseUrl || !apiKey) {
        reportError('未配置模型服务地址或 API Key（agentv2.openaiCompatible）')
        return
      }

      callbacks.onInfo?.(`使用模型 ${model} 进行流式生成…`)

      const tools = [
        {
          name: 'create_shape',
          description: 'Create a shape on the canvas',
          input_schema: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              x: { type: 'number' },
              y: { type: 'number' },
              props: { type: 'object' },
            },
            required: ['type', 'x', 'y', 'props'],
          },
        },
        {
          name: 'update_shape',
          description: 'Update a shape props by id',
          input_schema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              props: { type: 'object' },
            },
            required: ['id', 'props'],
          },
        },
        {
          name: 'delete_shapes',
          description: 'Delete shapes by ids',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
            },
            required: ['ids'],
          },
        },
        {
          name: 'select_shapes',
          description: 'Select shapes by ids',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
            },
            required: ['ids'],
          },
        },
        {
          name: 'align',
          description: 'Align selected shapes',
          input_schema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['left', 'right', 'top', 'bottom', 'center-x', 'center-y'] },
            },
            required: ['mode'],
          },
        },
        {
          name: 'distribute',
          description: 'Distribute selected shapes',
          input_schema: {
            type: 'object',
            properties: {
              mode: { type: 'string', enum: ['horizontal', 'vertical'] },
            },
            required: ['mode'],
          },
        },
        {
          name: 'reorder',
          description: 'Reorder shapes z-index',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              direction: { type: 'string', enum: ['to-front', 'to-back', 'forward', 'backward'] },
            },
            required: ['ids', 'direction'],
          },
        },
        {
          name: 'viewport_move',
          description: 'Move viewport to bounds',
          input_schema: {
            type: 'object',
            properties: { x: { type: 'number' }, y: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } },
            required: ['x', 'y'],
          },
        },
        {
          name: 'move',
          description: 'Move shapes by dx, dy',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              dx: { type: 'number' },
              dy: { type: 'number' },
            },
            required: ['ids', 'dx', 'dy'],
          },
        },
        {
          name: 'rotate',
          description: 'Rotate shapes by angle (radians)',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              angle: { type: 'number' },
            },
            required: ['ids', 'angle'],
          },
        },
        {
          name: 'resize',
          description: 'Resize shapes by absolute or scale values',
          input_schema: {
            type: 'object',
            properties: {
              ids: { type: 'array', items: { type: 'string' } },
              scaleX: { type: 'number' },
              scaleY: { type: 'number' },
              w: { type: 'number' },
              h: { type: 'number' },
            },
            required: ['ids'],
          },
        },
        {
          name: 'pen_draw',
          description: 'Draw freehand pen stroke with points',
          input_schema: {
            type: 'object',
            properties: {
              points: {
                type: 'array',
                items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } },
              },
              color: { type: 'string' },
              size: { type: 'number' },
            },
            required: ['points'],
          },
        },
      ]

      const ctx = body.context || {}
      const ctxText = `\n[viewport] ${JSON.stringify(ctx.viewport ?? null)}\n[selectionIds] ${JSON.stringify(
        ctx.selectionIds ?? [],
      )}\n[shapes-in-viewport] ${JSON.stringify((ctx.shapes ?? []).slice(0, 100))}`
      const systemPrompt = `You are a drafting assistant for a tldraw canvas. Follow these rules:
- Default language: respond in Simplified Chinese for every natural-language message.
- The tool suite listed below is always在线且可用，不允许说“工具不可用”或类似表述。
- When the user requests any canvas change, you MUST pick the most suitable tool and emit a tool call instead of describing manual操作。
- Keep replies concise, professional, and fully in Chinese; avoid English or mixed-language output。
- After each tool call completes, add one short Chinese sentence summarizing the outcome unless the user explicitly asks for tool output only。
- Only when请求与工具完全无关时，才可以纯文本回复；否则必须调用工具。
- If a request truly cannot be satisfied after considering every tool,解释原因时也要确认工具清单仍然有效，并可选创建文本形状告知用户。

Available tools:
- create_shape: Create a shape with {type, x, y, props}
- update_shape: Update shape props by {id, props}
- delete_shapes: Delete shapes by {ids}
- select_shapes: Select shapes by {ids}
- align: Align selected shapes by {mode}
- distribute: Distribute selected shapes by {mode}
- reorder: Reorder shapes by {ids, direction}
- viewport_move: Move viewport to {x, y, w?, h?}
- move: Move shapes by {ids, dx, dy}
- rotate: Rotate shapes by {ids, angle}
- resize: Resize shapes by {ids, scaleX?, scaleY?, w?, h?}
- pen_draw: Draw freehand by {points, color?, size?}`

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${body.message}\n\n---\ncontext:\n${ctxText}` },
      ]

      loop: while (true) {
        const payload = {
          model,
          stream: true,
          tools,
          tool_choice: { type: 'auto' },
          max_tokens: 10240,
          messages,
        }

        const resp = await fetch(`${baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
          signal: ac.signal,
        })

        if (!resp.ok || !resp.body) {
          const text = await resp.text().catch(() => '')
          reportError(`模型接口错误：${text || resp.statusText}`)
          return
        }

        const reader = resp.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        let pendingTool: { id: string; name: string; input?: any } | null = null

        while (true) {
          if (ac.signal.aborted) throw new Error('aborted')

          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          let index
          while ((index = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, index)
            buffer = buffer.slice(index + 2)
            if (!chunk) continue

            const lines = chunk.split('\n')
            let eventName: string | null = null
            let dataStr: string | null = null

            for (const ln of lines) {
              if (ln.startsWith('event:')) {
                eventName = ln.slice(6).trim()
              } else if (ln.startsWith('data:')) {
                dataStr = (dataStr ?? '') + ln.slice(5).trim()
              }
            }

            if (dataStr === '[DONE]') {
              callbacks.onDone?.('生成完成')
              continue
            }
            if (!dataStr) continue

            try {
              const json = JSON.parse(dataStr)
              this.logger.debug(`[STREAM] event=${eventName ?? 'message'} payload=${dataStr.slice(0, 200)}`)

              if (eventName === 'content_block_start') {
                const block = json?.content_block
                if (block?.type === 'tool_use') {
                  const id = (block.id || json?.id || block.tool_use_id) as string | undefined
                  const name = block.name as string | undefined
                  const input = block.input
                  const map = this.toolBuffers.get(sessionId)
                  if (id && name && map) {
                    if (!map.has(id)) {
                      map.set(id, { name, jsonText: '' })
                    }
                    if (input && typeof input === 'object' && Object.keys(input).length > 0) {
                      callbacks.onDelta?.({ action: { _type: name, ...input } as TldrawAgentAction })
                      pendingTool = { id, name, input }
                      this.logger.debug(`[STREAM] tool_use immediate id=${id} name=${name}`)
                    } else {
                      pendingTool = { id, name }
                      this.logger.debug(`[STREAM] tool_use pending id=${id} name=${name}`)
                    }
                  }
                }
              } else if (eventName === 'content_block_delta') {
                const delta = json?.delta
                if (delta?.text) {
                  callbacks.onDelta?.({ content: String(delta.text) })
                }
                const id = (json?.id || json?.tool_use_id || json?.content_block_id) as string | undefined
                if (delta?.partial_json && id) {
                  const map = this.toolBuffers.get(sessionId)
                  const buf = map?.get(id)
                  if (buf) {
                    buf.jsonText += delta.partial_json
                    try {
                      const parsed = JSON.parse(buf.jsonText)
                      callbacks.onDelta?.({ action: { _type: buf.name, ...parsed } as TldrawAgentAction })
                      map.delete(id)
                      pendingTool = { id, name: buf.name, input: parsed }
                      this.logger.debug(`[STREAM] tool_use completed id=${id} name=${buf.name}`)
                    } catch {}
                  }
                }
              } else if (eventName === 'message_delta') {
                const delta = json?.delta?.text
                if (delta) callbacks.onDelta?.({ content: String(delta) })
              } else if (eventName === 'tool_use') {
                const name = json?.name as string | undefined
                const input = json?.input
                const id = (json?.id || json?.tool_use_id || json?.tool_call_id) as string | undefined

                if (name && input && typeof input === 'object') {
                  callbacks.onDelta?.({ action: { _type: name, ...input } as TldrawAgentAction })
                  pendingTool = { id: id || `${Date.now()}`, name, input }
                } else if (name && id) {
                  const map = this.toolBuffers.get(sessionId)!
                  if (!map.has(id)) map.set(id, { name, jsonText: '' })
                  pendingTool = { id, name }
                }
              } else if (eventName === 'input_json_delta') {
                const id = (json?.tool_use_id || json?.id || json?.tool_call_id) as string | undefined
                const partial = (json?.partial_json || json?.delta || json?.text || '') as string
                if (id && partial) {
                  const map = this.toolBuffers.get(sessionId)
                  const buf = map?.get(id)
                  if (buf) {
                    buf.jsonText += partial
                    try {
                      const parsed = JSON.parse(buf.jsonText)
                      callbacks.onDelta?.({ action: { _type: buf.name, ...parsed } as TldrawAgentAction })
                      map.delete(id)
                      pendingTool = { id, name: buf.name, input: parsed }
                      this.logger.debug(`[STREAM] tool_use completed (input_json_delta) id=${id} name=${buf.name}`)
                    } catch {}
                  }
                }
              } else if (eventName === 'message_stop') {
                callbacks.onDone?.('生成完成')
              }
            } catch {
              callbacks.onDelta?.({ content: dataStr })
            }
          }
        }


        if (pendingTool) {
          messages.push({
            role: 'assistant',
            content: [{ type: 'tool_use', id: pendingTool.id, name: pendingTool.name, input: pendingTool.input || {} }],
          })
          messages.push({
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: pendingTool.id,
                content: typeof pendingTool.input === 'object' && pendingTool.input
                  ? JSON.stringify({ status: 'ok' })
                  : 'ok',
              },
            ],
          })
          console.log('[tldraw-agent] tool invoked', pendingTool)
          pendingTool = null
          continue loop
        }

        break loop
      }

      callbacks.onDone?.('流结束')
    } catch (error) {
      const message = (error as Error)?.message
      if (message === 'aborted') {
        callbacks.onInfo?.('任务已取消')
      } else if (message === 'terminated') {
        this.logger.warn(`[STREAM] session ${sessionId} terminated by upstream`)
        callbacks.onInfo?.('模型连接已结束')
      } else {
        const msg = message || '处理失败'
        this.logger.error(`[STREAM] session ${sessionId} failed`, error as Error)
        reportError(msg)
      }
    } finally {
      this.abortControllers.delete(sessionId)
      this.toolBuffers.delete(sessionId)
      this.logger.log(`[STREAM] session ${sessionId} finished`)
    }
  }

  cancelSession(sessionId: string) {
    const controller = this.abortControllers.get(sessionId)
    if (controller && !controller.signal.aborted) {
      controller.abort()
    }
    this.abortControllers.delete(sessionId)
    this.toolBuffers.delete(sessionId)
  }

  resetSession(sessionId: string) {
    this.cancelSession(sessionId)
  }
}



