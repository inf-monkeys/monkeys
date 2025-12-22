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
import { SuccessResponse } from '@/common/response';
import { AgentService, CreateAgentDto, UpdateAgentDto } from './services/agent.service';
import { ThreadService, CreateThreadDto, UpdateThreadDto } from './services/thread.service';
import { MessageService } from './services/message.service';
import { StreamingService, StreamOptions } from './services/streaming.service';
import { AgentToolExecutorService } from './services/agent-tool-executor.service';
import { ToolCallRepository } from './repositories/tool-call.repository';

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
    private readonly agentToolExecutor: AgentToolExecutorService,
    private readonly toolCallRepository: ToolCallRepository,
  ) {}

  // ========== Agent CRUD ==========

  @Post()
  async createAgent(@Body() dto: CreateAgentDto) {
    const data = await this.agentService.create(dto);
    return new SuccessResponse({ data });
  }

  @Get()
  async listAgents(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    const data = await this.agentService.list(teamId);
    return new SuccessResponse({ data });
  }

  @Get('models')
  async listModels(@Query('teamId') teamId?: string) {
    const data = await this.agentService.listModels(teamId);
    return new SuccessResponse({ data });
  }

  // ========== Thread 管理（放在 :agentId 之前） ==========

  @Post('threads')
  async createThread(@Body() dto: CreateThreadDto) {
    const data = await this.threadService.create(dto);
    return new SuccessResponse({ data });
  }

  @Get('threads')
  async listThreads(
    @Query('userId') userId: string,
    @Query('teamId') teamId: string,
    @Query('agentId') agentId?: string,
  ) {
    if (!userId || !teamId) {
      throw new BadRequestException('userId and teamId are required');
    }
    const data = await this.threadService.listByUser(userId, teamId, agentId);
    return new SuccessResponse({ data });
  }

  @Get('threads/:threadId')
  async getThread(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    const data = await this.threadService.get(threadId, teamId);
    return new SuccessResponse({ data });
  }

  @Put('threads/:threadId')
  async updateThread(
    @Param('threadId') threadId: string,
    @Body() dto: UpdateThreadDto,
    @Query('teamId') teamId?: string,
  ) {
    const data = await this.threadService.update(threadId, dto, teamId);
    return new SuccessResponse({ data });
  }

  @Delete('threads/:threadId')
  async deleteThread(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    await this.threadService.delete(threadId, teamId);
    return new SuccessResponse({ data: { success: true } });
  }

  @Get('threads/:threadId/messages')
  async getMessages(@Param('threadId') threadId: string, @Query('teamId') teamId?: string) {
    const data = await this.messageService.getThreadMessages(threadId, teamId);
    return new SuccessResponse({ data });
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
    const data = await this.agentService.get(agentId, teamId);
    return new SuccessResponse({ data });
  }

  @Put(':agentId')
  async updateAgent(
    @Param('agentId') agentId: string,
    @Body() dto: UpdateAgentDto,
    @Query('teamId') teamId?: string,
  ) {
    const data = await this.agentService.update(agentId, dto, teamId);
    return new SuccessResponse({ data });
  }

  @Delete(':agentId')
  async deleteAgent(@Param('agentId') agentId: string, @Query('teamId') teamId?: string) {
    await this.agentService.delete(agentId, teamId);
    return new SuccessResponse({ data: { success: true } });
  }

  // ========== Tool Call Management（工具调用管理） ==========

  /**
   * 获取线程的待审批工具调用
   */
  @Get('threads/:threadId/tool-calls/pending')
  async getPendingToolCalls(
    @Param('threadId') threadId: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    const data = await this.agentToolExecutor.getPendingApprovals(threadId, teamId);
    return new SuccessResponse({ data });
  }

  /**
   * 审批或拒绝工具调用
   */
  @Post('tool-calls/:toolCallId/approve')
  async approveToolCall(
    @Param('toolCallId') toolCallId: string,
    @Body() body: { approved: boolean; userId: string; teamId: string },
  ) {
    if (!body.userId || !body.teamId) {
      throw new BadRequestException('userId and teamId are required');
    }

    await this.agentToolExecutor.handleApproval(
      toolCallId,
      body.approved,
      body.userId,
    );

    return new SuccessResponse({ data: { success: true, approved: body.approved } });
  }

  /**
   * 获取线程的工具调用历史
   */
  @Get('threads/:threadId/tool-calls')
  async getToolCallHistory(
    @Param('threadId') threadId: string,
    @Query('teamId') teamId?: string,
  ) {
    const data = await this.toolCallRepository.findByThreadId(threadId, teamId);
    return new SuccessResponse({ data });
  }

  /**
   * 获取团队的工具调用统计
   */
  @Get('tool-calls/stats')
  async getToolCallStats(
    @Query('teamId') teamId: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    const data = await this.agentToolExecutor.getUsageStats(teamId, period || 'day');
    return new SuccessResponse({ data });
  }
}
