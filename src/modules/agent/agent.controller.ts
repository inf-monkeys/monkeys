import { SuccessResponse } from '@/common/response';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { ToolCallRepository } from './repositories/tool-call.repository';
import { AgentToolExecutorService } from './services/agent-tool-executor.service';
import { AgentToolRegistryService } from './services/agent-tool-registry.service';
import { AgentService, CreateAgentDto, UpdateAgentDto } from './services/agent.service';
import { MessageService } from './services/message.service';
import { RelationshipDiscoveryService, RelationshipDiscoveryRequest } from './services/relationship-discovery.service';
import { StreamingService, StreamOptions } from './services/streaming.service';
import { CreateThreadDto, ThreadService, UpdateThreadDto } from './services/thread.service';
import { InspirationPushService, InspirationPushRequest } from './services/inspiration-push.service';

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
    private readonly agentToolRegistry: AgentToolRegistryService,
    private readonly toolCallRepository: ToolCallRepository,
    private readonly relationshipDiscovery: RelationshipDiscoveryService,
    private readonly inspirationPush: InspirationPushService,
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

  @Get('available-tools')
  async getAvailableTools(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    const data = await this.agentToolRegistry.getAvailableTools(teamId);
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
      // Canvas context for tldraw-assistant
      canvasData?: any;
      selectedShapeIds?: string[];
      viewport?: { x: number; y: number; zoom: number };
    },
    @Res() res: Response,
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
      // Canvas context for tldraw-assistant
      canvasData: body.canvasData,
      selectedShapeIds: body.selectedShapeIds,
      viewport: body.viewport,
    };

    const result = await this.streamingService.streamForAssistantUI(options);

    // 返回 AI SDK 标准响应 (文本流)
    const streamResponse = result.toTextStreamResponse();
    const readable = streamResponse.body ? Readable.fromWeb(streamResponse.body as any) : null;

    // 透传响应头，确保是 chunked 流式
    streamResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    // 显式禁用代理缓冲
    res.setHeader('X-Accel-Buffering', 'no');

    if (readable) {
      res.status(streamResponse.status);
      readable.pipe(res);
    } else {
      res.status(streamResponse.status).end();
    }
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

  // ========== Canvas 逻辑关系发现 ==========

  /**
   * 发现画板中选中图形之间的逻辑关系
   *
   * 分析选中的图形，识别它们之间的：
   * - 基础相关关系
   * - 需求→功能→逻辑→原型的因果映射关系
   * - 依赖关系、包含关系等
   */
  @Post('canvas/discover-relationships')
  async discoverRelationships(@Body() body: RelationshipDiscoveryRequest) {
    if (!body.teamId || !body.userId) {
      throw new BadRequestException('teamId and userId are required');
    }

    if (!body.shapes || body.shapes.length === 0) {
      throw new BadRequestException('At least one shape is required');
    }

    const data = await this.relationshipDiscovery.discoverRelationships(body);
    return new SuccessResponse({ data });
  }

  // ========== 创作灵感推送 ==========

  /**
   * 推送创作灵感到Thread
   *
   * 当用户60秒无操作时由前端调用此接口：
   * 1. 分析当前画布的创作状态（发散/收敛/停滞）
   * 2. 基于AI语义分析生成灵感建议
   * 3. 自动向thread推送AI消息
   *
   * 前端需要实现：
   * - 监听用户在画布上的操作
   * - 60秒无操作后自动调用此接口
   * - 接收返回的消息并显示在对话界面
   */
  @Post('canvas/push-inspiration')
  async pushInspiration(@Body() body: InspirationPushRequest) {
    if (!body.teamId || !body.userId || !body.threadId) {
      throw new BadRequestException('teamId, userId and threadId are required');
    }

    if (!body.canvasData) {
      throw new BadRequestException('canvasData is required');
    }

    const data = await this.inspirationPush.pushInspiration(body);
    return new SuccessResponse({ data });
  }

  /**
   * 检查是否应该推送灵感
   *
   * 前端可以在调用push-inspiration之前先调用此接口判断：
   * - Thread是否处于活动状态
   * - 是否在冷却时间内（避免频繁推送）
   */
  @Get('canvas/should-push-inspiration')
  async shouldPushInspiration(
    @Query('threadId') threadId: string,
    @Query('teamId') teamId: string,
  ) {
    if (!threadId || !teamId) {
      throw new BadRequestException('threadId and teamId are required');
    }

    const shouldPush = await this.inspirationPush.shouldPushInspiration(threadId, teamId);
    return new SuccessResponse({ data: { shouldPush } });
  }

  /**
   * 测试接口：使用模拟数据触发灵感推送
   *
   * 用于快速测试灵感推送功能，无需等待60秒或准备完整的画布数据
   *
   * @example
   * POST /agents/canvas/test-inspiration
   * {
   *   "teamId": "your-team-id",
   *   "userId": "your-user-id",
   *   "threadId": "your-thread-id",
   *   "scenario": "empty" | "divergent" | "convergent" | "complex"
   * }
   */
  @Post('canvas/test-inspiration')
  async testInspiration(
    @Body() body: {
      teamId: string;
      userId: string;
      threadId: string;
      scenario?: 'empty' | 'divergent' | 'convergent' | 'complex';
    },
  ) {
    if (!body.teamId || !body.userId || !body.threadId) {
      throw new BadRequestException('teamId, userId and threadId are required');
    }

    // 根据场景生成模拟画布数据
    const scenario = body.scenario || 'divergent';
    let mockCanvasData: any;

    switch (scenario) {
      case 'empty':
        // 空画布场景 - 应该触发停滞状态
        mockCanvasData = {
          shapes: [],
        };
        break;

      case 'divergent':
        // 发散场景 - 大量不同类型的图形
        mockCanvasData = {
          shapes: [
            { id: 'shape1', type: 'text', props: { text: '用户需求：提升转化率' }, x: 100, y: 100 },
            { id: 'shape2', type: 'text', props: { text: '想法1：优化首页布局' }, x: 300, y: 100 },
            { id: 'shape3', type: 'text', props: { text: '想法2：添加推荐系统' }, x: 500, y: 100 },
            { id: 'shape4', type: 'rect', props: { label: 'A/B测试方案' }, x: 100, y: 300 },
            { id: 'shape5', type: 'ellipse', props: { text: '数据分析' }, x: 300, y: 300 },
            { id: 'shape6', type: 'arrow', props: {}, x: 200, y: 150 },
            { id: 'shape7', type: 'text', props: { text: '想法3：个性化推送' }, x: 700, y: 100 },
            { id: 'shape8', type: 'note', props: { text: '参考竞品：淘宝、京东' }, x: 500, y: 300 },
          ],
        };
        break;

      case 'convergent':
        // 收敛场景 - 有结构和层次的内容
        mockCanvasData = {
          shapes: [
            { id: 'shape1', type: 'text', props: { text: '核心功能：智能推荐' }, x: 200, y: 50 },
            { id: 'shape2', type: 'rect', props: { label: '1. 用户画像建模' }, x: 100, y: 150 },
            { id: 'shape3', type: 'rect', props: { label: '2. 协同过滤算法' }, x: 100, y: 250 },
            { id: 'shape4', type: 'rect', props: { label: '3. 内容推荐引擎' }, x: 100, y: 350 },
            { id: 'shape5', type: 'arrow', props: {}, x: 150, y: 100 },
            { id: 'shape6', type: 'text', props: { text: '技术选型：TensorFlow' }, x: 400, y: 200 },
            { id: 'shape7', type: 'text', props: { text: '预期效果：提升30%转化' }, x: 400, y: 300 },
          ],
        };
        break;

      case 'complex':
        // 复杂场景 - 大量内容
        mockCanvasData = {
          shapes: Array.from({ length: 35 }, (_, i) => ({
            id: `shape${i + 1}`,
            type: ['text', 'rect', 'ellipse', 'arrow'][i % 4],
            props: {
              text: `元素 ${i + 1}`,
              label: `标签 ${i + 1}`,
            },
            x: (i % 7) * 150,
            y: Math.floor(i / 7) * 120,
          })),
        };
        break;
    }

    const data = await this.inspirationPush.pushInspiration({
      teamId: body.teamId,
      userId: body.userId,
      threadId: body.threadId,
      canvasData: mockCanvasData,
    });

    return new SuccessResponse({
      data: {
        ...data,
        testInfo: {
          scenario,
          shapesCount: mockCanvasData.shapes.length,
          message: '测试数据已生成并触发灵感推送',
        },
      },
    });
  }
}
