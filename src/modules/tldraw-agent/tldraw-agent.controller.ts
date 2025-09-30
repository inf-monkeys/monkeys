import { Body, Controller, Post } from '@nestjs/common';
import { TldrawAgentService } from './tldraw-agent.service';

// 注意：已在 main.ts 设置全局前缀 'api/'，此处无需再包含 'api'
@Controller('tldraw-agent')
export class TldrawAgentController {
  constructor(private readonly service: TldrawAgentService) {}

  @Post('request')
  async request(@Body() body: any) {
    return this.service.handleRequest(body)
  }
}


