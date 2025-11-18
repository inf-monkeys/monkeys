import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { AuthenticationType, IRequest } from '@/common/typings/request';
import { AgentV3SessionRepository } from '@/database/repositories/agent-v3-session.repository';
import { AgentV3MessageRepository } from '@/database/repositories/agent-v3-message.repository';
import { MediaFileRepository } from '@/database/repositories/media.repository';
import { MediaFileService } from '@/modules/assets/media/media.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AgentV3ModelRegistryService } from './agent-v3.model-registry.service';
import { AgentV3RunLoopService } from './agent-v3.run-loop.service';
import { AgentV3ChatRequestDto, AgentV3SessionCreateDto, AgentV3SessionUpdateDto } from './dto/agent-v3-session.dto';

@ApiTags('AgentV3')
@UseGuards(CompatibleAuthGuard)
@Controller('/api/agent-v3')
export class AgentV3Controller {
  constructor(
    private readonly sessionRepo: AgentV3SessionRepository,
    private readonly messageRepo: AgentV3MessageRepository,
    private readonly mediaRepo: MediaFileRepository,
    private readonly modelRegistry: AgentV3ModelRegistryService,
    private readonly runLoop: AgentV3RunLoopService,
    private readonly mediaService: MediaFileService,
  ) {}

  @Post('/sessions')
  @ApiOperation({ summary: '创建 AgentV3 会话' })
  async createSession(@Body() body: AgentV3SessionCreateDto, @Req() req: IRequest) {
    const { teamId, userId } = req;
    const session = await this.sessionRepo.createSession(teamId, userId, { title: body.title, modelId: body.modelId });
    return session;
  }

  @Get('/sessions')
  @ApiOperation({ summary: '列出当前用户的 AgentV3 会话' })
  async listSessions(@Req() req: IRequest) {
    const { teamId, userId } = req;
    return this.sessionRepo.listByUser(teamId, userId);
  }

  @Get('/sessions/:id')
  @ApiOperation({ summary: '获取会话详情' })
  async getSession(@Param('id') id: string, @Req() req: IRequest) {
    const { teamId, userId } = req;
    return this.sessionRepo.getById(teamId, userId, id);
  }

  @Patch('/sessions/:id')
  @ApiOperation({ summary: '更新会话' })
  async updateSession(@Param('id') id: string, @Body() body: AgentV3SessionUpdateDto, @Req() req: IRequest) {
    const { teamId, userId } = req;
    return this.sessionRepo.updateSession(teamId, userId, id, { title: body.title, modelId: body.modelId });
  }

  @Delete('/sessions/:id')
  @ApiOperation({ summary: '删除会话（软删）' })
  async deleteSession(@Param('id') id: string, @Req() req: IRequest) {
    const { teamId, userId } = req;
    await this.sessionRepo.softDelete(teamId, userId, id);
    return { success: true };
  }

  @Get('/sessions/:id/messages')
  @ApiOperation({ summary: '分页获取会话消息' })
  async listMessages(@Param('id') sessionId: string, @Query('page') page = '1', @Query('limit') limit = '20', @Req() req: IRequest) {
    const { teamId, userId } = req;
    const session = await this.sessionRepo.getById(teamId, userId, sessionId);
    if (!session) {
      return { page: +page, limit: +limit, total: 0, data: [] };
    }
    const { data, total } = await this.messageRepo.listMessages(sessionId, teamId, { page: +page, limit: +limit });

    // 展示版消息
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

  @Get('/models')
  @ApiOperation({ summary: '列出当前 team 支持的模型' })
  async listModels() {
    return this.modelRegistry.listModels();
  }

  @Post('/chat/stream')
  @ApiOperation({ summary: '启动 AgentV3 流式对话（SSE）' })
  @ApiBody({ type: AgentV3ChatRequestDto })
  async chatStream(@Body() body: AgentV3ChatRequestDto, @Req() req: IRequest, @Res() res: Response) {
    const { teamId, userId } = req;
    req.authenticationType = AuthenticationType.TOKEN;

    const session = await this.sessionRepo.getById(teamId, userId, body.sessionId);
    if (!session) {
      res.status(404).end();
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.runLoop.runAgentLoop({
        sessionId: body.sessionId,
        teamId,
        userId,
        modelId: body.modelId || session.modelId,
        userMessage: body.message,
        imageMediaIds: body.imageMediaIds || [],
      })) {
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
}
