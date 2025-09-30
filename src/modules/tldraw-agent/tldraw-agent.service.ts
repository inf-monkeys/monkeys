import { Injectable } from '@nestjs/common';

@Injectable()
export class TldrawAgentService {
  async handleRequest(body: any) {
    const message: string = body?.message ?? ''
    // 占位实现：返回未配置模型的提示与回显
    return {
      ok: true,
      message: `Agent 后端已收到请求，但尚未配置模型。收到指令: ${message}`,
    }
  }
}



