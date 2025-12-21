import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AgentService, CreateAgentDto, UpdateAgentDto } from './services/agent.service';
import { ThreadService, CreateThreadDto, UpdateThreadDto } from './services/thread.service';
import { MessageService } from './services/message.service';
import { StreamingService, StreamOptions } from './services/streaming.service';

/**
 * Agent Controller
 *
 * **API 端点**：
 * - Agent CRUD
 * - Thread 管理
 * - Message 查询
 * - 流式聊天
 */
@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly threadService: ThreadService,
    private readonly messageService: MessageService,
    private readonly streamingService: StreamingService,
  ) {}

  // ========== Agent CRUD ==========

  @Post()
  async createAgent(@Body() dto: CreateAgentDto) {
    return await this.agentService.create(dto);
  }

  @Get()
  async listAgents(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    return await this.agentService.list(teamId);
  }

  @Get('models')
  async listModels(@Query('teamId') teamId?: string) {
    return await this.agentService.listModels(teamId);
  }

  // ========== Thread 管理（放在 :agentId 之前） ==========

  @Post('threads')
  async createThread(@Body() dto: CreateThreadDto) {
    return await this.threadService.create(dto);
  }

  @Get('threads')
  async listThreads(@Query('userId') userId: string, @Query('teamId') teamId: string) {
    if (!userId || !teamId) {
      throw new BadRequestException('userId and teamId are required');
    }
    return await this.threadService.listByUser(userId, teamId);
  }

  @Get('threads/:threadId')
  async getThread(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    return await this.threadService.get(threadId, teamId);
  }

  @Put('threads/:threadId')
  async updateThread(
    @Param('threadId') threadId: string,
    @Body() dto: UpdateThreadDto,
    @Query('teamId') teamId?: string,
  ) {
    return await this.threadService.update(threadId, dto, teamId);
  }

  @Delete('threads/:threadId')
  async deleteThread(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    await this.threadService.delete(threadId, teamId);
    return { success: true };
  }

  @Get('threads/:threadId/messages')
  async getMessages(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    return await this.messageService.getThreadMessages(threadId, teamId);
  }

  @Post('threads/:threadId/stream')
  async streamChat(
    @Param('threadId') threadId: string,
    @Body() body: {
      teamId: string;
      userId: string;
      agentId?: string;
      modelId?: string;
      userMessage: string;
      imageMediaIds?: string[];
      systemPrompt?: string;
    },
    @Res() res: Response,
  ): Promise<void> {
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 禁用缓冲

    try {
      const options: StreamOptions = {
        threadId,
        ...body,
      };

      for await (const chunk of this.streamingService.streamAgentResponse(options)) {
        res.write(chunk);
      }

      res.end();
    } catch (error) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          timestamp: Date.now(),
        })}\n\n`,
      );
      res.end();
    }
  }

  /**
   * AI SDK 标准格式聊天端点 - 供 assistant-ui 使用
   */
  @Post('threads/:threadId/chat')
  async chat(
    @Param('threadId') threadId: string,
    @Body() body: {
      teamId: string;
      userId: string;
      agentId?: string;
      modelId?: string;
      messages: any[]; // AI SDK messages format
      system?: string;
    },
  ) {
    // 从 messages 中提取最后一条用户消息
    const lastMessage = body.messages[body.messages.length - 1];
    let userMessage = '';
    const imageMediaIds: string[] = [];

    if (lastMessage && lastMessage.role === 'user') {
      if (typeof lastMessage.content === 'string') {
        userMessage = lastMessage.content;
      } else if (Array.isArray(lastMessage.content)) {
        for (const part of lastMessage.content) {
          if (part.type === 'text') {
            userMessage = part.text;
          }
          // 可以扩展支持图片
        }
      }
    }

    const options: StreamOptions = {
      threadId,
      teamId: body.teamId,
      userId: body.userId,
      agentId: body.agentId,
      modelId: body.modelId,
      userMessage,
      imageMediaIds: imageMediaIds.length > 0 ? imageMediaIds : undefined,
      systemPrompt: body.system,
    };

    const result = await this.streamingService.streamForAssistantUI(options);

    // 返回 AI SDK 标准响应
    return result.toTextStreamResponse();
  }

  // ========== Agent 动态路由（放在最后） ==========

  @Get(':agentId')
  async getAgent(@Param('agentId') agentId: string, @Query('teamId') teamId?: string) {
    return await this.agentService.get(agentId, teamId);
  }

  @Put(':agentId')
  async updateAgent(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentDto,
    @Query('teamId') teamId?: string,
  ) {
    return await this.agentService.update(agentId, dto, teamId);
  }

  @Delete(':agentId')
  async deleteAgent(@Param('agentId') agentId: string, @Query('teamId') teamId?: string) {
    await this.agentService.delete(agentId, teamId);
    return { success: true };
  }
}
