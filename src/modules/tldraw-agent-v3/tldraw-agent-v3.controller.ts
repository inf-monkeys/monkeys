import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { AuthenticationType, IRequest } from '@/common/typings/request';
import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { AgentV3SessionRepository } from '@/database/repositories/agent-v3-session.repository';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TldrawAgentV3Service, CanvasSnapshot } from './tldraw-agent-v3.service';

type StreamBody = {
  boardId: string;
  message: string;
  sessionId?: string;
  modelId?: string;
  canvasSnapshot?: CanvasSnapshot;
};

@ApiTags('Tldraw Agent V3')
@UseGuards(CompatibleAuthGuard)
@Controller('tldraw-agent-v3')
export class TldrawAgentV3Controller {
  constructor(
    private readonly service: TldrawAgentV3Service,
    private readonly sessionRepo: AgentV3SessionRepository,
    private readonly messageRepo: AgentV3MessageRepository,
    private readonly mediaRepo: MediaFileRepository,
    private readonly mediaService: MediaFileService,
  ) {}

  @Post('/stream')
  @ApiOperation({ summary: '启动 tldraw agent-v3 流式对话（SSE）' })
  async stream(@Body() body: StreamBody, @Req() req: IRequest, @Res() res: Response) {
    const { teamId, userId } = req;
    req.authenticationType = AuthenticationType.TOKEN;
    const { boardId, message, sessionId, modelId, canvasSnapshot } = body;

    if (!boardId || !message) {
      res.status(400).json({ error: 'boardId and message are required' });
      return;
    }

    const resolvedSessionId = await this.service.resolveSession({ boardId, teamId, userId, sessionId, modelId });
    if (canvasSnapshot) {
      this.service.updateSnapshot(resolvedSessionId, canvasSnapshot);
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.service.stream({ boardId, teamId, userId, modelId, message, sessionId: resolvedSessionId }, canvasSnapshot)) {
        res.write(chunk);
      }
    } catch (error) {
      const payload = {
        type: 'error',
        error_code: 'INTERNAL_ERROR',
        error_message: (error as Error).message,
        timestamp: Math.floor(Date.now() / 1000),
      };
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('/history')
  @ApiOperation({ summary: '获取 tldraw agent-v3 会话历史' })
  async history(@Query('boardId') boardId: string, @Query('sessionId') sessionId: string, @Query('page') page = '1', @Query('limit') limit = '20', @Req() req: IRequest) {
    const { teamId, userId } = req;
    let resolvedSessionId = sessionId;

    if (!resolvedSessionId && boardId) {
      const binding = await this.service.findBinding(boardId, teamId);
      resolvedSessionId = binding?.sessionId;
    }

    if (!resolvedSessionId) {
      return { page: +page, limit: +limit, total: 0, data: [] };
    }

    const session = await this.sessionRepo.getById(teamId, userId, resolvedSessionId);
    if (!session) {
      return { page: +page, limit: +limit, total: 0, data: [] };
    }

    const { data, total } = await this.messageRepo.listMessages(resolvedSessionId, teamId, { page: +page, limit: +limit });

    const view = [];
    for (const row of data) {
      const base: any = {
        id: row.id,
        role: row.role,
        createdAt: new Date(row.createdTimestamp).toISOString(),
        modelId: row.modelId,
      };

      if (row.role === 'user' && row.content) {
        try {
          const parts = JSON.parse(row.content);
          const textParts = parts.filter((p) => p.type === 'text').map((p) => p.text || '');
          const imageParts = parts.filter((p) => p.type === 'image' && p.media_id);
          base.text = textParts.join('\n').trim();
          if (imageParts.length) {
            const images = [];
            for (const img of imageParts) {
              const mediaId = img.media_id;
              const media = await this.mediaRepo.getMediaByIdAndTeamId(mediaId, row.teamId);
              if (media) {
                const url = await this.mediaService.getPublicUrl(media);
                images.push({ mediaId, url });
              }
            }
            base.images = images;
          }
        } catch {
          base.text = row.content;
        }
      } else if (row.role === 'assistant' && !row.toolCallId) {
        base.text = row.content;
      }

      if (row.toolCallId && row.toolName && row.toolInput) {
        try {
          base.toolCall = {
            toolCallId: row.toolCallId,
            toolName: row.toolName,
            input: JSON.parse(row.toolInput),
          };
        } catch {
          base.toolCall = {
            toolCallId: row.toolCallId,
            toolName: row.toolName,
            input: row.toolInput,
          };
        }
      }

      if (row.toolCallId && row.toolName && row.toolOutput) {
        try {
          base.toolResult = {
            toolCallId: row.toolCallId,
            toolName: row.toolName,
            output: JSON.parse(row.toolOutput),
          };
        } catch {
          base.toolResult = {
            toolCallId: row.toolCallId,
            toolName: row.toolName,
            output: row.toolOutput,
          };
        }
      }

      view.push(base);
    }

    return {
      page: +page,
      limit: +limit,
      total,
      data: view,
    };
  }
}
