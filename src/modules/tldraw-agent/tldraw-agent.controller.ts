import { config } from '@/common/config'
import { Body, Controller, HttpCode, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import * as fs from 'fs'
import OpenAI from 'openai'
import * as os from 'os'
import * as path from 'path'
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

  // 简单的语音转写代理接口：接收前端上传的音频并调用 OpenAI 兼容 API 进行转写
  @Post('transcribe')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async transcribe(@UploadedFile() file: any) {
    if (!file?.buffer?.length) {
      return { text: '' }
    }

    // 根据上传文件名动态选择后缀，避免写死为 .webm 导致部分上游服务按扩展名解析失败
    // 前端目前在 FormData 里用的是 'audio.webm'，如果以后改成 mp3 / wav 等，这里会自动跟随
    const extFromName = file.originalname ? path.extname(file.originalname) : ''
    const safeExt = extFromName && typeof extFromName === 'string' ? extFromName : '.webm'

    // 将内存中的音频写入临时文件供 SDK 读取
    const tmpFile = path.join(os.tmpdir(), `tldraw-audio-${Date.now()}${safeExt}`)
    await fs.promises.writeFile(tmpFile, file.buffer)

    try {
      const openai = new OpenAI({
        apiKey: config.agentv2.openaiCompatible.apiKey || process.env.OPENAI_API_KEY,
        baseURL: config.agentv2.openaiCompatible.url || process.env.OPENAI_BASE_URL,
      })

      const result = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tmpFile) as any,
        model: 'gpt-4o-transcribe',
      })
      return { text: (result as any)?.text || '' }
    } finally {
      // 清理临时文件
      fs.promises.unlink(tmpFile).catch(() => undefined)
    }
  }
}


