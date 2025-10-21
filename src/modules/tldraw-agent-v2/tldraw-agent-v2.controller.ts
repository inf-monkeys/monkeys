import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { IRequest } from '@/common/typings/request';
import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TldrawAgentV2Service } from './tldraw-agent-v2.service';

export interface TldrawAgentV2RequestPayload {
  message: string;
  bounds?: { x: number; y: number; w: number; h: number };
  modelName?: string;
  context?: any;
  agentId?: string;
  userId?: string;
  teamId?: string;
}

type StreamRequestBody = TldrawAgentV2RequestPayload & { sessionId?: string };

@ApiTags('Tldraw Agent V2')
@ApiBearerAuth()
@UseGuards(CompatibleAuthGuard)
@Controller('tldraw-agent-v2')
export class TldrawAgentV2Controller {
  private readonly logger = new Logger(TldrawAgentV2Controller.name);
  
  constructor(private readonly service: TldrawAgentV2Service) {}

  @Post('stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '启动tldraw agent-v2流式处理' })
  @ApiResponse({ status: 200, description: '流式处理启动成功' })
  async stream(@Request() req: IRequest, @Body() body: StreamRequestBody, @Res() res: Response) {
    let sessionId = body.sessionId || `tldraw-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let closed = false;

    const abort = () => {
      if (closed) return;
      closed = true;
      this.service.cancelSession(sessionId);
      try {
        res.end();
      } catch {}
    };

    const writeEvent = (event: string, data?: any) => {
      if (closed) return;
      res.write(`event: ${event}\n`);
      if (data !== undefined) {
        res.write(`data: ${JSON.stringify(data)}\n`);
      }
      res.write('\n');
    };

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With, x-monkeys-teamid');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.flushHeaders?.();

    writeEvent('session_start', { sessionId });

    const heartbeat = setInterval(() => {
      writeEvent('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000);

    const onClose = () => {
      clearInterval(heartbeat);
      abort();
    };

    res.on('close', onClose);
    res.on('finish', onClose);
    res.on('error', onClose);

    try {
      // 获取当前用户的真实信息
      const { teamId, userId } = req;
      
      this.logger.log(`Starting tldraw agent session with teamId: ${teamId}, userId: ${userId}`);
      this.logger.log(`Request headers: ${JSON.stringify(req.headers)}`);
      
      // 验证认证信息
      if (!teamId || !userId) {
        this.logger.error(`Missing authentication info - teamId: ${teamId}, userId: ${userId}`);
        writeEvent('error', { message: 'Authentication required' });
        abort();
        return;
      }
      
      // 始终使用认证后的真实用户信息，忽略前端发送的假值
      // 系统会自动在当前用户的团队下创建一个默认的tldraw Agent
      const tempSessionId = await this.service.startSession(
        'default-tldraw-agent',
        userId,
        teamId
      );
      sessionId = tempSessionId;

      await this.service.startStream(
        sessionId,
        {
          message: body.message,
          context: body.context,
          modelName: body.modelName,
        },
        {
          onInfo: (message) => writeEvent('info', { message }),
          onDelta: (payload) => {
            if (payload.content) {
              writeEvent('delta', { content: payload.content });
            }
            if (payload.action) {
              writeEvent('action', { action: payload.action });
            }
          },
          onDone: (message) => writeEvent('done', { message }),
          onError: (message) => {
            writeEvent('error', { message });
            abort();
          },
        },
      );
    } catch (error) {
      writeEvent('error', { message: error instanceof Error ? error.message : 'Unknown error' });
      abort();
    }

    clearInterval(heartbeat);
    abort();
  }

  @Post('start-session')
  @ApiOperation({ summary: '启动新的tldraw agent-v2会话' })
  @ApiResponse({ status: 200, description: '会话启动成功' })
  async startSession(@Body() body: { agentId: string; userId: string; teamId: string }) {
    const sessionId = await this.service.startSession(body.agentId, body.userId, body.teamId);
    return {
      success: true,
      data: { sessionId },
    };
  }

  @Post('stop-session')
  @ApiOperation({ summary: '停止tldraw agent-v2会话' })
  @ApiResponse({ status: 200, description: '会话停止成功' })
  async stopSession(@Body('sessionId') sessionId: string) {
    await this.service.stopSession(sessionId);
    return { success: true };
  }

  @Post('update-editor')
  @ApiOperation({ summary: '更新会话的editor实例' })
  @ApiResponse({ status: 200, description: 'Editor更新成功' })
  async updateEditor(@Body() body: { sessionId: string; editor: any }) {
    this.service.updateSessionEditor(body.sessionId, body.editor);
    return { success: true };
  }

  @Post('cancel')
  @ApiOperation({ summary: '取消tldraw agent-v2会话' })
  @ApiResponse({ status: 200, description: '会话取消成功' })
  async cancel(@Body('sessionId') sessionId: string) {
    this.service.cancelSession(sessionId);
    return { success: true };
  }

  @Post('reset')
  @ApiOperation({ summary: '重置tldraw agent-v2会话' })
  @ApiResponse({ status: 200, description: '会话重置成功' })
  async reset(@Body('sessionId') sessionId: string) {
    this.service.resetSession(sessionId);
    return { success: true };
  }
}
