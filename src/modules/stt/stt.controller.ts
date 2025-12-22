import { config } from '@/common/config'
import { Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import * as fs from 'fs'
import OpenAI from 'openai'
import * as os from 'os'
import * as path from 'path'

@Controller('STT')
export class SttController {
  /**
   * 通用语音转文本接口
   * URL: /api/STT
   * 方法: POST
   * Body: multipart/form-data，字段名为 file
   *
   * 默认使用 Cursor 的 OpenAI 兼容语音接口：
   *   baseURL: https://api.cursorai.art/v1
   *   model: whisper-1
   *
   * 可通过环境变量进行覆盖：
   *   STT_API_KEY        - 优先使用的语音 API key
   *   STT_BASE_URL       - 优先使用的语音 API base URL
   *   STT_MODEL          - 模型名称，默认 whisper-1
   *   STT_TIMEOUT_MS     - 请求超时时间，默认 20000ms
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async transcribe(@UploadedFile() file: any) {
    if (!file?.buffer?.length) {
      return { text: '' }
    }

    // 根据上传文件名动态选择后缀，避免写死为 .webm 导致部分上游服务按扩展名解析失败
    const extFromName = file.originalname ? path.extname(file.originalname) : ''
    const safeExt = extFromName && typeof extFromName === 'string' ? extFromName : '.webm'

    const tmpFile = path.join(os.tmpdir(), `stt-audio-${Date.now()}${safeExt}`)
    await fs.promises.writeFile(tmpFile, file.buffer)

     try {
      const apiKey =
        process.env.STT_API_KEY ||
        process.env.SPEECH_OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        config.agent.openai?.apiKey ||
        config.agentv2.openaiCompatible.apiKey

      const baseURL =
        process.env.STT_BASE_URL ||
        process.env.SPEECH_OPENAI_BASE_URL ||
        process.env.OPENAI_BASE_URL ||
        config.agent.openai?.baseUrl ||
        config.agentv2.openaiCompatible.url ||
        'https://api.cursorai.art/v1'

      if (!apiKey) {
        console.error('[STT] transcribe: missing API key')
        return { text: '' }
      }

      const client = new OpenAI({ apiKey, baseURL })
      const timeoutMs = Number(process.env.STT_TIMEOUT_MS || 20000)
      const model = process.env.STT_MODEL || 'whisper-1'

      const result = await client.audio.transcriptions.create(
        {
          file: fs.createReadStream(tmpFile) as any,
          model,
        },
        { timeout: timeoutMs } as any,
      )

      const text = (result as any)?.text || ''
      return { text }
    } catch (error) {
      console.error('[STT] transcribe failed:', error)
      return { text: '' }
    } finally {
      fs.promises.unlink(tmpFile).catch(() => undefined)
    }
  }
}


