import { config } from '@/common/config';
import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type AgentClientToServer = {
  prompt: (payload: { message: string; bounds?: { x: number; y: number; w: number; h: number }; modelName?: string }) => void
  cancel: () => void
  reset: () => void
};

type AgentServerToClient = {
  info: (payload: { message: string }) => void
  delta: (payload: { content?: string; action?: any }) => void
  done: (payload: { message: string }) => void
  error: (payload: { message: string }) => void
};

@Injectable()
@WebSocketGateway({ namespace: '/tldraw-agent' })
export class TldrawAgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  public server!: Server<AgentClientToServer, AgentServerToClient>;

  private readonly logger = new Logger(TldrawAgentGateway.name);
  private readonly abortControllers = new Map<string, AbortController>();
  // 临时存储：每个 client 的工具增量 JSON 缓冲 { clientId -> { toolCallId -> { name, jsonText } } }
  private readonly toolBuffers = new Map<string, Map<string, { name: string; jsonText: string }>>();

  handleConnection(client: Socket) {
    this.logger.log(`client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`client disconnected: ${client.id}`);
    const ac = this.abortControllers.get(client.id);
    if (ac) ac.abort();
    this.abortControllers.delete(client.id);
    this.toolBuffers.delete(client.id);
  }

  @SubscribeMessage('prompt')
  async onPrompt(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { message: string; bounds?: { x: number; y: number; w: number; h: number }; modelName?: string; context?: any },
  ) {
    if (!body?.message) {
      client.emit('error', { message: 'message 不能为空' });
      return;
    }

    // 取消上一任务
    this.onCancel(client);

    const ac = new AbortController();
    this.abortControllers.set(client.id, ac);
    this.toolBuffers.set(client.id, new Map());
    try {
      const baseUrl = (config.agentv2?.openaiCompatible?.url || '').replace(/\/$/, '')
      const apiKey = config.agentv2?.openaiCompatible?.apiKey
      const model = body.modelName || 'claude-sonnet-4-20250514-thinking'

      if (!baseUrl || !apiKey) {
        client.emit('error', { message: '未配置模型服务地址或 API Key（agentv2.openaiCompatible）' })
        return
      }

      client.emit('info', { message: `使用模型 ${model} 进行流式生成…` })

      // 定义与官方相同结构的工具（示例子集；可继续补充）
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
            properties: { ids: { type: 'array', items: { type: 'string' } }, dx: { type: 'number' }, dy: { type: 'number' } },
            required: ['ids', 'dx', 'dy'],
          },
        },
        {
          name: 'rotate',
          description: 'Rotate shapes by angle (radians)',
          input_schema: {
            type: 'object',
            properties: { ids: { type: 'array', items: { type: 'string' } }, angle: { type: 'number' } },
            required: ['ids', 'angle'],
          },
        },
        {
          name: 'resize',
          description: 'Resize shapes by absolute or scale values',
          input_schema: {
            type: 'object',
            properties: { ids: { type: 'array', items: { type: 'string' } }, scaleX: { type: 'number' }, scaleY: { type: 'number' }, w: { type: 'number' }, h: { type: 'number' } },
            required: ['ids'],
          },
        },
        {
          name: 'pen_draw',
          description: 'Draw freehand pen stroke with points',
          input_schema: {
            type: 'object',
            properties: { points: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } } }, color: { type: 'string' }, size: { type: 'number' } },
            required: ['points'],
          },
        },
      ]

      // 组装可见性上下文（简要结构化文本，与官方 PromptPart 思路一致）
      const ctx = body.context || {}
      const ctxText = `\n[viewport] ${JSON.stringify(ctx.viewport ?? null)}\n[selectionIds] ${JSON.stringify(ctx.selectionIds ?? [])}\n[shapes-in-viewport] ${JSON.stringify((ctx.shapes ?? []).slice(0, 100))}`
      const systemPrompt = `You are a tldraw agent. Prefer using tools to operate the canvas rather than describing steps. Respond in the user language when chatting.

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

      // 会话循环：messages 累积 assistant 的 tool_use 与 user 的 tool_result
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${body.message}\n\n---\ncontext:\n${ctxText}` },
      ]
      loop: while (true) {
        const payload = { model, stream: true, tools, tool_choice: { type: 'auto' as const }, max_tokens: 1024, messages }
        const resp = await fetch(`${baseUrl}/messages`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload), signal: ac.signal,
        })
        if (!resp.ok || !resp.body) {
          const text = await resp.text().catch(() => '')
          client.emit('error', { message: `模型接口错误：${text || resp.statusText}` })
          return
        }
        const reader = resp.body.getReader(); const decoder = new TextDecoder('utf-8'); let buffer = ''
        let pendingTool: { id: string; name: string; input?: any } | null = null
        while (true) {
          if (ac.signal.aborted) throw new Error('aborted')
          const { done, value } = await reader.read(); if (done) break
          buffer += decoder.decode(value, { stream: true })
          let idx
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx); buffer = buffer.slice(idx + 2); if (!chunk) continue
            const lines = chunk.split('\n'); let ev: string | null = null; let dataStr: string | null = null
            for (const ln of lines) { if (ln.startsWith('event:')) ev = ln.slice(6).trim(); else if (ln.startsWith('data:')) dataStr = ln.slice(5).trim() }
            if (dataStr === '[DONE]') { client.emit('done', { message: '生成完成' }); continue }
            if (!dataStr) continue
            try {
              const json = JSON.parse(dataStr)
              if (ev === 'content_block_delta') {
                const t = json?.delta?.text; if (t) client.emit('delta', { content: String(t) })
              } else if (ev === 'message_delta') {
                const t = json?.delta?.text; if (t) client.emit('delta', { content: String(t) })
              } else if (ev === 'tool_use') {
                const name = json?.name as string | undefined; const input = json?.input; const id = (json?.id || json?.tool_use_id || json?.tool_call_id) as string | undefined
                if (name && input && typeof input === 'object') { 
                  console.log('[DEBUG] tool_use complete:', { name, input })
                  client.emit('delta', { action: { _type: name, ...input } }); 
                  pendingTool = { id: id || `${Date.now()}`, name, input } 
                }
                else if (name && id) { 
                  console.log('[DEBUG] tool_use partial:', { name, id })
                  const map = this.toolBuffers.get(client.id)!; 
                  if (!map.has(id)) map.set(id, { name, jsonText: '' }); 
                  pendingTool = { id, name } 
                }
              } else if (ev === 'input_json_delta') {
                const id = (json?.tool_use_id || json?.id || json?.tool_call_id) as string | undefined; const partial = (json?.partial_json || json?.delta || json?.text || '') as string
                if (id && partial) { const map = this.toolBuffers.get(client.id)!; const buf = map.get(id); if (buf) { buf.jsonText += partial; try { const parsed = JSON.parse(buf.jsonText); client.emit('delta', { action: { _type: buf.name, ...parsed } }); map.delete(id); pendingTool = { id, name: buf.name, input: parsed } } catch {} } }
              } else if (ev === 'message_stop') { client.emit('done', { message: '生成完成' }) }
            } catch { client.emit('delta', { content: dataStr }) }
          }
        }
        if (pendingTool) {
          // 把工具调用回写为 tool_result，然后继续下一轮
          messages.push({ role: 'assistant', content: [{ type: 'tool_use', id: pendingTool.id, name: pendingTool.name, input: pendingTool.input || {} }] })
          messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: pendingTool.id, content: 'ok' }] })
          continue loop
        }
        break loop
      }

      client.emit('done', { message: '流结束' })
    } catch (e) {
      if ((e as Error).message === 'aborted') {
        client.emit('info', { message: '任务已取消' })
      } else {
        client.emit('error', { message: '处理失败' })
      }
    }
  }

  @SubscribeMessage('cancel')
  onCancel(@ConnectedSocket() client: Socket) {
    const ac = this.abortControllers.get(client.id);
    if (ac && !ac.signal.aborted) ac.abort();
    this.abortControllers.delete(client.id);
  }

  @SubscribeMessage('reset')
  onReset(@ConnectedSocket() client: Socket) {
    this.onCancel(client);
    client.emit('info', { message: '会话已重置' });
  }
}


