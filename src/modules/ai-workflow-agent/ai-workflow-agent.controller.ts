import { Body, Controller, Post, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AiWorkflowAgentService } from './ai-workflow-agent.service';
import { ExecuteGoalDto, ExecuteGoalResultDto } from './dto/execute-goal.dto';
import { CompatibleAuthGuard } from '@/common/guards/auth.guard';
import { TeamGuard } from '@/common/guards/team.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentTeam } from '@/common/decorators/current-team';

/**
 * AI 工作流 Agent 控制器
 *
 * 提供基于 AI Agent 的工作流自动生成和执行 API
 * 与 AI Workflow Builder 的区别：
 * - AI Workflow Builder: 生成工作流定义，返回 workflowId
 * - AI Workflow Agent: 根据目标自动生成并执行工作流，直到完成任务
 */
@ApiTags('AI Workflow Agent')
@ApiBearerAuth()
@Controller('ai-workflow-agent')
@UseGuards(CompatibleAuthGuard, TeamGuard)
export class AiWorkflowAgentController {
  constructor(private readonly agentService: AiWorkflowAgentService) {}

  /**
   * 执行目标（主 API）
   *
   * AI Agent 会：
   * 1. 分解用户目标为多个阶段
   * 2. 为每个阶段生成工作流
   * 3. 自动执行工作流
   * 4. 监控结果并处理错误
   * 5. 返回最终结果
   */
  @Post('execute-goal')
  @ApiOperation({
    summary: '执行目标（AI Agent 自主模式）',
    description: `
      根据用户目标，AI Agent 自动分解任务、生成工作流、执行并监控，直到完成。

      示例场景：
      - "生成一个 POM 工具并测试上线"
      - "用 Gemini 和 Jimeng 生成图片"
      - "分析用户数据并生成报告"

      与 /ai-workflow-builder/generate 的区别：
      - Builder: 只生成工作流定义，不执行
      - Agent: 生成 + 执行 + 监控 + 自动处理错误
    `,
  })
  @ApiResponse({
    status: 200,
    description: '目标执行成功或失败（包含详细的阶段信息）',
    type: ExecuteGoalResultDto,
  })
  async executeGoal(
    @Body() dto: ExecuteGoalDto,
    @CurrentTeam() teamId: string,
    @CurrentUser('userId') userId: string
  ): Promise<ExecuteGoalResultDto> {
    return await this.agentService.executeGoal({
      goal: dto.goal,
      teamId,
      userId,
      maxRetries: dto.maxRetries,
      inputParams: dto.inputParams,
    });
  }

  /**
   * 执行目标（SSE 流式响应）
   *
   * Phase 4: 实时推送 Agent 执行进度
   */
  @Post('execute-goal/stream')
  @ApiOperation({
    summary: '执行目标（SSE 流式响应）',
    description: `
      与 /execute-goal 功能相同，但通过 Server-Sent Events (SSE) 实时推送执行进度。

      客户端会收到以下类型的事件：
      - goal_start: 开始执行目标
      - decompose_start/complete: 目标分解
      - stage_start/complete/failed: 阶段执行
      - workflow_generate_start/complete: 工作流生成
      - workflow_execute_start: 工作流执行
      - workflow_status: 工作流状态更新
      - tool_analysis_start/complete: 工具能力分析
      - error_analysis_start/complete: 错误分析
      - retry: 重试事件
      - goal_complete: 目标完成
      - error: 错误事件

      使用示例：
      fetch('/api/ai-workflow-agent/execute-goal/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' },
        body: JSON.stringify({ goal: '...', inputParams: {} })
      }).then(response => {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        // 读取 SSE 流...
      });
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'SSE 连接建立成功，开始推送进度事件',
  })
  async executeGoalStream(
    @Body() dto: ExecuteGoalDto,
    @CurrentTeam() teamId: string,
    @CurrentUser('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      // 设置 SSE 响应头
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

      // 发送连接确认
      res.write(`event: connection\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'connection',
          message: 'SSE 连接已建立',
          timestamp: new Date().toISOString(),
        })}\n\n`,
        'utf8',
      );

      // 连接状态标志
      let isConnected = true;

      // 处理客户端断开连接
      const cleanup = () => {
        isConnected = false;
      };

      res.on('close', cleanup);
      res.on('finish', cleanup);
      res.on('error', cleanup);

      // 启动 Agent 执行，传入进度回调
      const result = await this.agentService.executeGoal({
        goal: dto.goal,
        teamId,
        userId,
        maxRetries: dto.maxRetries,
        inputParams: dto.inputParams,
        onProgress: (event) => {
          if (isConnected) {
            try {
              // 发送进度事件
              res.write(`event: ${event.type}\n`);
              res.write(`data: ${JSON.stringify(event)}\n\n`, 'utf8');
            } catch (error) {
              // 写入失败，标记为断开
              isConnected = false;
            }
          }
        },
      });

      // 发送最终结果
      if (isConnected) {
        res.write(`event: complete\n`);
        res.write(
          `data: ${JSON.stringify({
            type: 'complete',
            result,
            timestamp: new Date().toISOString(),
          })}\n\n`,
          'utf8',
        );
      }

      // 结束连接
      res.end();
    } catch (error) {
      // 发送错误事件
      res.write(`event: error\n`);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        })}\n\n`,
        'utf8',
      );
      res.end();
    }
  }
}
