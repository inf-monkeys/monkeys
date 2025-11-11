import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { readConfig } from '@/common/config/readYaml';
import { URL } from 'url';

type ProxyRequestBody = {
  url: string;
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  };
};

@Controller('/api/fal')
export class FalProxyController {
  private readonly allowedHosts = new Set([
    'fal.ai',
    'fal.run',
    'api.fal.ai',
    'gateway.run.fal.ai',
    'run.fal.ai',
    'realtime.fal.ai',
    'realtime.run.fal.ai',
    'queue.fal.ai',
    'queue.run.fal.ai',
  ]);

  constructor(private readonly http: HttpService) {}

  @Post('/proxy')
  async postProxy(@Body() body: ProxyRequestBody) {
    const apiKey = readConfig('fal.apiKey', process.env.FAL_KEY);
    if (!apiKey) {
      throw new HttpException('FAL apiKey not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const targetUrl = (body?.url || '').trim();
    if (!targetUrl) {
      throw new HttpException('Missing url', HttpStatus.BAD_REQUEST);
    }

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new HttpException('Invalid url', HttpStatus.BAD_REQUEST);
    }

    const host = parsed.host.toLowerCase();
    const isAllowed =
      this.allowedHosts.has(host) ||
      host.endsWith('.fal.ai') ||
      host.endsWith('.run.fal.ai');

    if (!isAllowed) {
      throw new HttpException('Target host not allowed', HttpStatus.FORBIDDEN);
    }

    const method = (body?.init?.method || 'POST').toUpperCase();
    const headers: Record<string, string> = {
      ...(body?.init?.headers || {}),
      Authorization: `Key ${apiKey}`,
    };

    try {
      const resp = await firstValueFrom(
        this.http.request({
          method,
          url: targetUrl,
          headers,
          // axios 会根据 method 决定 data/params 使用
          data: body?.init?.body,
          // 让服务端返回原始 JSON（FAL 返回 JSON）
          validateStatus: () => true,
        }),
      );

      // 直接透传远端响应体与状态码
      if (resp.status >= 200 && resp.status < 300) {
        return resp.data;
      } else {
        throw new HttpException(
          resp?.data || `FAL upstream error: ${resp.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }
    } catch (e: any) {
      const message = e?.response?.data || e?.message || 'Upstream error';
      throw new HttpException(message, HttpStatus.BAD_GATEWAY);
    }
  }

  // 兼容性：某些客户端可能发 GET
  @Get('/proxy')
  async getProxy(@Query('url') url: string) {
    return this.postProxy({ url, init: { method: 'GET' } });
  }
}
