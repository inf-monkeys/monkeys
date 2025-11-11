import { All, Body, Controller, Headers, HttpException, HttpStatus, Req, Res } from '@nestjs/common'
import axios from 'axios'
import type { Request, Response } from 'express'
import { readConfig } from '@/common/config/readYaml'

// Note: global prefix 'api/' is set in main.ts, so controller path should not include '/api'
@Controller('/fal/proxy')
export class FalProxyController {
  private getFalKey(): string | undefined {
    return readConfig('fal.apiKey', readConfig('apiKey'))
  }

  // Handle GET and POST generically by using @Req/@Res and forwarding
  @All()
  async handleAll(@Req() req: Request, @Res() res: Response, @Headers() headers: Record<string, any>, @Body() body: any) {
    try {
      if (req.method.toUpperCase() === 'OPTIONS') {
        res.status(204).end()
        return
      }
      const targetUrlHeader = headers['x-fal-target-url'] || headers['X-Fal-Target-Url'] || headers['x-fal-targeturl']
      const targetUrl = Array.isArray(targetUrlHeader) ? targetUrlHeader[0] : targetUrlHeader
      if (!targetUrl || typeof targetUrl !== 'string') {
        throw new HttpException('Missing x-fal-target-url header', HttpStatus.BAD_REQUEST)
      }

      const falKey = this.getFalKey()
      if (!falKey) {
        throw new HttpException('FAL api key not configured', HttpStatus.INTERNAL_SERVER_ERROR)
      }

      // Copy headers, remove hop-by-hop and host headers, set Authorization
      const outgoingHeaders: Record<string, any> = {}
      for (const [k, v] of Object.entries(headers)) {
        const lower = k.toLowerCase()
        if (['host', 'connection', 'content-length', 'accept-encoding'].includes(lower)) continue
        // Do not forward original authorization
        if (lower === 'authorization') continue
        // // Do not forward our internal control header to upstream
        // if (lower === 'x-fal-target-url') continue
        outgoingHeaders[k] = v as any
      }
      outgoingHeaders['authorization'] = `Key ${falKey}`

      const method = req.method as any
      const isGet = method.toUpperCase() === 'GET'

      const upstream = await axios.request({
        url: targetUrl,
        method,
        headers: outgoingHeaders,
        data: isGet ? undefined : body,
        responseType: 'stream',
        validateStatus: () => true,
      })

      res.status(upstream.status)
      for (const [k, v] of Object.entries(upstream.headers)) {
        if (k.toLowerCase() === 'transfer-encoding') continue
        res.setHeader(k, v as any)
      }
      upstream.data.pipe(res)
    } catch (e: any) {
      const status = e?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR
      const msg = e?.response?.data ?? e?.message ?? 'Proxy error'
      if (!res.headersSent) {
        res.status(status).send(typeof msg === 'string' ? msg : JSON.stringify(msg))
      } else {
        res.end()
      }
    }
  }
}


