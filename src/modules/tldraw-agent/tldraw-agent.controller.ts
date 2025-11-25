import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { TldrawAgentRequestPayload, TldrawAgentService } from './tldraw-agent.service'

type StreamRequestBody = TldrawAgentRequestPayload & { sessionId?: string }

// 注意：已在 main.ts 设置全局前缀 'api/'，此处无需再包含 'api'
@Controller('tldraw-agent')
export class TldrawAgentController {
  constructor(private readonly service: TldrawAgentService) {}

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  async stream(@Body() body: StreamRequestBody, @Res() res: Response) {
    const sessionId = body.sessionId || `${Date.now()}-${Math.random().toString(16).slice(2)}`
    let closed = false
    const abort = () => {
      if (closed) return
      closed = true
      this.service.cancelSession(sessionId)
      try {
        res.end()
      } catch {}
    }

    const writeEvent = (event: string, data?: any) => {
      if (closed) return
      res.write(`event: ${event}\n`)
      if (data !== undefined) {
        res.write(`data: ${JSON.stringify(data)}\n`)
      }
      res.write('\n')
    }

    res.status(HttpStatus.OK)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')
    res.flushHeaders?.()

    writeEvent('session_start', { sessionId })

    const heartbeat = setInterval(() => {
      writeEvent('heartbeat', { timestamp: new Date().toISOString() })
    }, 30000)

    const onClose = () => {
      clearInterval(heartbeat)
      abort()
    }

    res.on('close', onClose)
    res.on('finish', onClose)
    res.on('error', onClose)

    await this.service.startStream(
      sessionId,
      {
        message: body.message,
        bounds: body.bounds,
        modelName: body.modelName,
        context: body.context,
      },
      {
        onInfo: (message) => writeEvent('info', { message }),
        onDelta: (payload) => {
          if (payload.content) {
            writeEvent('delta', { content: payload.content })
          }
          if (payload.action) {
            writeEvent('action', { action: payload.action })
          }
        },
        onDone: (message) => writeEvent('done', { message }),
        onError: (message) => {
          writeEvent('error', { message })
          abort()
        },
      },
    )

    clearInterval(heartbeat)
    abort()
  }

  @Post('cancel')
  async cancel(@Body('sessionId') sessionId: string) {
    if (sessionId) {
      this.service.cancelSession(sessionId)
    }
    return { success: true }
  }

  @Post('reset')
  async reset(@Body('sessionId') sessionId: string) {
    if (sessionId) {
      this.service.resetSession(sessionId)
    }
    return { success: true }
  }
}
