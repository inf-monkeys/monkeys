import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ToolCallRepository } from '../repositories/tool-call.repository';
import { AgentToolRegistryService } from './agent-tool-registry.service';
import { AgentQuotaService } from './agent-quota.service';
import { ToolsForwardService } from '@/modules/tools/tools.forward.service';
import { ToolCallEntity } from '@/database/entities/agents/tool-call.entity';
import {
  ToolCallParams,
  ToolExecutionResult,
  ResolvedTool,
  ToolSourceType,
  ToolExecutionTimeoutError,
  UsageStats,
} from '../types/tool.types';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowExecutionService } from '@/modules/workflow/workflow.execution.service';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';

/**
 * Agent Tool Executor Service
 *
 * **职责**：
 * - 执行工具调用（外部工具 + 内置工具）
 * - 同步审批流程（阻塞式等待）
 * - 并发控制和配额检查
 * - 错误处理并格式化返回给 LLM
 * - 工具调用记录保存
 */
@Injectable()
export class AgentToolExecutorService {
  private readonly logger = new Logger(AgentToolExecutorService.name);
  private readonly DEFAULT_TIMEOUT = 30000; // 30秒
  private readonly DEFAULT_APPROVAL_TIMEOUT = 300000; // 5分钟

  constructor(
    private readonly toolCallRepository: ToolCallRepository,
    private readonly agentToolRegistry: AgentToolRegistryService,
    private readonly quotaService: AgentQuotaService,
    private readonly toolsForwardService: ToolsForwardService,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowRepository: WorkflowRepository,
    @Inject(forwardRef(() => WorkflowExecutionService))
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * 执行工具调用（包含审批和并发控制）
   */
  async execute(params: ToolCallParams): Promise<ToolExecutionResult> {
    const { threadId, messageId, teamId, userId, toolCallId, toolName, args } = params;

    this.logger.debug(`Executing tool: ${toolName} for thread ${threadId}`);

    const startTime = Date.now();
    let toolCall: ToolCallEntity;
    let concurrencyAcquired = false;

    try {
      // 1. 获取工具定义
      const tool = await this.agentToolRegistry.getToolByName(toolName, teamId);

      // 2. 检查配额
      await this.quotaService.checkAndConsumeQuota(teamId);

      // 3. 获取并发槽
      const acquired = await this.quotaService.acquireConcurrencySlot(teamId);
      if (!acquired) {
        throw new Error('Too many concurrent tool calls. Please try again later.');
      }
      concurrencyAcquired = true;

      // 4. 创建工具调用记录
      toolCall = await this.toolCallRepository.create({
        toolCallId,
        threadId,
        messageId,
        teamId,
        toolName,
        input: args,
        status: tool.metadata?.needsApproval ? 'pending' : 'running',
        approvalStatus: tool.metadata?.needsApproval ? 'pending' : 'not_required',
      });

      // 5. 审批流程（如果需要）
      if (tool.metadata?.needsApproval) {
        this.logger.log(`Tool ${toolName} requires approval, waiting...`);

        // 发送审批请求事件
        this.eventEmitter.emit('tool.approval.request', {
          toolCallId: toolCall.id,
          toolName,
          args,
          threadId,
          teamId,
        });

        // 等待审批结果
        const approved = await this.waitForApproval(
          toolCall.id,
          tool.metadata.timeout || this.DEFAULT_APPROVAL_TIMEOUT,
        );

        if (!approved) {
          await this.toolCallRepository.update(toolCall.id, {
            status: 'error',
            approvalStatus: 'rejected',
            isError: true,
            errorText: 'Tool execution rejected by user',
          });

          return {
            success: false,
            error: {
              message: 'Tool execution was rejected by the user. Please try a different approach.',
              code: 'APPROVAL_REJECTED',
            },
            approvalStatus: 'rejected',
          };
        }

        // 审批通过，更新状态
        await this.toolCallRepository.update(toolCall.id, {
          status: 'running',
          approvalStatus: 'approved',
        });
      }

      // 6. 执行工具
      const result = await this.executeToolInternal(tool, args, {
        teamId,
        userId,
        threadId,
        toolCallId,
      });

      const duration = Date.now() - startTime;

      // 7. 保存结果
      await this.toolCallRepository.update(toolCall.id, {
        status: 'completed',
        output: result,
        duration,
        isError: false,
      });

      this.logger.debug(`Tool ${toolName} executed successfully in ${duration}ms`);

      return {
        success: true,
        result,
        duration,
        approvalStatus: toolCall.approvalStatus,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // 格式化错误信息
      const formattedError = this.formatErrorForLLM(error);

      // 保存错误记录
      if (toolCall) {
        await this.toolCallRepository.update(toolCall.id, {
          status: 'error',
          isError: true,
          errorText: error.message || 'Unknown error',
          duration,
        });
      }

      this.logger.error(`Tool ${toolName} execution failed:`, error);

      return {
        success: false,
        error: formattedError,
        duration,
      };
    } finally {
      // 8. 释放并发槽
      if (concurrencyAcquired) {
        await this.quotaService.releaseConcurrencySlot(teamId);
      }
    }
  }

  /**
   * 处理审批（由 API 端点调用）
   */
  async handleApproval(toolCallId: string, approved: boolean, userId: string): Promise<void> {
    const toolCall = await this.toolCallRepository.findById(toolCallId);

    if (!toolCall) {
      throw new Error(`ToolCall ${toolCallId} not found`);
    }

    if (toolCall.approvalStatus !== 'pending') {
      throw new Error(`ToolCall ${toolCallId} is not pending approval`);
    }

    // 更新审批状态
    await this.toolCallRepository.updateApprovalStatus(
      toolCallId,
      approved ? 'approved' : 'rejected',
      userId,
    );

    // 触发审批结果事件
    this.eventEmitter.emit(`tool.approval.result.${toolCallId}`, { approved });

    this.logger.log(`ToolCall ${toolCallId} ${approved ? 'approved' : 'rejected'} by ${userId}`);
  }

  /**
   * 获取待审批的工具调用
   */
  async getPendingApprovals(threadId: string, teamId: string): Promise<ToolCallEntity[]> {
    return await this.toolCallRepository.findPendingApprovals(threadId, teamId);
  }

  /**
   * 获取团队的工具调用统计
   */
  async getUsageStats(teamId: string, period: 'day' | 'week' | 'month'): Promise<UsageStats> {
    return await this.quotaService.getUsageStats(teamId, period);
  }

  /**
   * 等待审批结果（阻塞式）
   */
  private async waitForApproval(toolCallId: string, timeout: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // 设置超时定时器
      const timer = setTimeout(() => {
        this.eventEmitter.off(`tool.approval.result.${toolCallId}`, handler);
        reject(new Error('Approval timeout'));
      }, timeout);

      // 监听审批结果事件
      const handler = (result: { approved: boolean }) => {
        clearTimeout(timer);
        resolve(result.approved);
      };

      this.eventEmitter.once(`tool.approval.result.${toolCallId}`, handler);
    });
  }

  /**
   * 执行工具（内部方法）
   */
  private async executeToolInternal(
    tool: ResolvedTool,
    args: any,
    context: {
      teamId: string;
      userId: string;
      threadId: string;
      toolCallId: string;
    },
  ): Promise<any> {
    const timeout = tool.metadata?.timeout || this.DEFAULT_TIMEOUT;

    // 根据工具来源类型执行
    if (tool.sourceType === ToolSourceType.BUILTIN) {
      // 执行内置工具
      return await this.executeBuiltinTool(tool.name, args, context);
    } else {
      // 执行外部工具（通过 ToolsForwardService）
      return await this.executeExternalTool(tool.name, args, context, timeout);
    }
  }

  /**
   * 执行外部工具
   */
  private async executeExternalTool(
    toolName: string,
    args: any,
    context: any,
    timeout: number,
  ): Promise<any> {
    // 构建工具调用上下文
    const toolContext = {
      appId: context.teamId,
      userId: context.userId,
      teamId: context.teamId,
    };

    // 使用 ToolsForwardService 执行
    const result = await Promise.race([
      this.toolsForwardService.invoke(toolName, args, toolContext),
      new Promise((_, reject) =>
        setTimeout(() => reject(new ToolExecutionTimeoutError(toolName, timeout)), timeout),
      ),
    ]);

    return result;
  }

  /**
   * 执行内置工具
   */
  private async executeBuiltinTool(
    toolName: string,
    args: any,
    context: any,
  ): Promise<any> {
    // 内置工具执行逻辑
    switch (toolName) {
      case 'web_search':
        return await this.builtinWebSearch(args);
      case 'list_workflows':
        return await this.builtinListWorkflows(args, context);
      case 'execute_workflow':
        return await this.builtinExecuteWorkflow(args, context);
      case 'list_tools':
        return await this.builtinListTools(args, context);
      default:
        throw new Error(`Builtin tool ${toolName} not implemented`);
    }
  }

  /**
   * 内置工具：网页搜索（示例）
   */
  private async builtinWebSearch(args: { query: string; limit?: number }): Promise<any> {
    // 这里可以集成实际的搜索服务
    // 暂时返回模拟结果
    return {
      query: args.query,
      results: [
        {
          title: 'Example Result',
          url: 'https://example.com',
          snippet: 'This is a simulated search result.',
        },
      ],
    };
  }

  /**
   * 内置工具：列出工作流
   */
  private async builtinListWorkflows(
    args: { includeHidden?: boolean },
    context: { teamId: string },
  ): Promise<any> {
    const { teamId } = context;
    const { includeHidden = false } = args;

    try {
      // 获取团队的所有工作流
      const workflows = await this.workflowRepository.findWorkflowByCondition({ teamId });

      // 过滤和格式化
      const formattedWorkflows = workflows
        .filter((wf) => includeHidden || !wf.hidden)
        .filter((wf) => wf.activated !== false) // 只返回激活的工作流
        .map((wf) => ({
          workflowId: wf.workflowId,
          name: typeof wf.displayName === 'string' ? wf.displayName : wf.displayName?.['zh-CN'] || wf.displayName?.['en-US'] || wf.workflowId,
          description: typeof wf.description === 'string' ? wf.description : wf.description?.['zh-CN'] || wf.description?.['en-US'] || '',
          version: wf.version,
          // 提取输入参数信息
          inputs: (wf.variables || []).map((v) => ({
            name: v.name,
            displayName: typeof v.displayName === 'string' ? v.displayName : v.displayName?.['zh-CN'] || v.displayName?.['en-US'] || v.name,
            type: v.type,
            required: v.required || false,
            default: v.default,
            description: typeof v.description === 'string' ? v.description : v.description?.['zh-CN'] || v.description?.['en-US'] || '',
          })),
          // 提取输出配置信息
          outputs: (wf.output || []).map((o) => ({
            key: o.key,
            value: o.value,
          })),
        }));

      return {
        count: formattedWorkflows.length,
        workflows: formattedWorkflows,
      };
    } catch (error) {
      this.logger.error('Failed to list workflows:', error);
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  /**
   * 内置工具：执行工作流
   */
  private async builtinExecuteWorkflow(
    args: { workflowId: string; inputData: any; sync?: boolean },
    context: { teamId: string; userId: string },
  ): Promise<any> {
    const { teamId, userId } = context;
    const { workflowId, inputData, sync = true } = args;

    try {
      this.logger.log(`Executing workflow ${workflowId} for team ${teamId}`);

      // 验证工作流存在（获取最新版本）
      const workflow = await this.workflowRepository.getWorkflowByIdWithoutVersion(workflowId, true);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      if (!workflow.activated) {
        throw new Error(`Workflow ${workflowId} is not activated`);
      }

      // 启动工作流
      const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
        teamId,
        userId,
        workflowId,
        inputData,
        triggerType: WorkflowTriggerType.MANUALLY,
        version: workflow.version,
      });

      if (!sync) {
        // 异步模式：立即返回实例ID
        return {
          workflowInstanceId,
          status: 'started',
          message: 'Workflow execution started. Use the workflowInstanceId to check status.',
        };
      }

      // 同步模式：等待工作流完成
      this.logger.log(`Waiting for workflow ${workflowInstanceId} to complete...`);
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);

      return {
        workflowInstanceId,
        status: result.status,
        output: result.output,
        message: 'Workflow execution completed successfully.',
      };
    } catch (error) {
      this.logger.error(`Failed to execute workflow ${workflowId}:`, error);
      throw new Error(`Failed to execute workflow: ${error.message}`);
    }
  }

  /**
   * 内置工具：列出可用工具
   */
  private async builtinListTools(
    args: { category?: string; includeParameters?: boolean },
    context: { teamId: string },
  ): Promise<any> {
    const { category, includeParameters = true } = args;
    const { teamId } = context;

    try {
      // 获取所有内置工具
      const builtinTools = this.agentToolRegistry.getBuiltinTools();

      // 获取团队的外部工具
      const externalTools = await this.agentToolRegistry.getExternalTools(teamId);

      // 合并并格式化
      const allTools = [
        ...builtinTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          category: tool.metadata?.category || 'uncategorized',
          sourceType: 'builtin',
          needsApproval: tool.metadata?.needsApproval || false,
          parameters: includeParameters ? tool.parameters : undefined,
        })),
        ...externalTools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          category: tool.category || 'uncategorized',
          sourceType: 'external',
          needsApproval: tool.needsApproval || false,
          parameters: includeParameters ? tool.inputSchema : undefined,
        })),
      ];

      // 按类别过滤
      const filteredTools = category
        ? allTools.filter((t) => t.category === category)
        : allTools;

      return {
        count: filteredTools.length,
        tools: filteredTools,
      };
    } catch (error) {
      this.logger.error('Failed to list tools:', error);
      throw new Error(`Failed to list tools: ${error.message}`);
    }
  }

  /**
   * 格式化错误信息（返回给 LLM）
   */
  private formatErrorForLLM(error: any): { message: string; code?: string; details?: any } {
    // 避免泄露敏感信息，但提供足够的上下文

    if (error instanceof ToolExecutionTimeoutError) {
      return {
        message: 'The tool execution took too long and was cancelled. Please try with simpler parameters or try again later.',
        code: 'TIMEOUT',
      };
    }

    if (error.code === 'ECONNREFUSED') {
      return {
        message: 'The tool service is currently unavailable. Please try again later or use a different tool.',
        code: 'SERVICE_UNAVAILABLE',
      };
    }

    if (error.code === 'ETIMEDOUT') {
      return {
        message: 'The tool request timed out. The service might be overloaded. Please try again.',
        code: 'TIMEOUT',
      };
    }

    if (error.name === 'QuotaExceededError') {
      return {
        message: 'Tool call quota has been exceeded. Please try again tomorrow or contact support to increase your quota.',
        code: 'QUOTA_EXCEEDED',
      };
    }

    // 默认错误处理
    const message = error.message || 'An unexpected error occurred while executing the tool.';

    // 清理敏感信息（去除路径、堆栈等）
    const sanitizedMessage = message
      .replace(/\/[^\s]+/g, '[path]') // 移除文件路径
      .replace(/at\s+.+:\d+:\d+/g, '') // 移除堆栈信息
      .trim();

    return {
      message: sanitizedMessage || 'An unknown error occurred.',
      code: error.code || 'UNKNOWN_ERROR',
    };
  }
}
