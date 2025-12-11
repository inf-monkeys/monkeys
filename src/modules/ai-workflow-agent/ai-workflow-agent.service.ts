import { Injectable, Logger } from '@nestjs/common';
import { AiWorkflowBuilderService } from '../ai-workflow-builder/ai-workflow-builder.service';
import { WorkflowExecutionService } from '../workflow/workflow.execution.service';
import { LlmService } from '../tools/llm/llm.service';
import { config } from '@/common/config';
import { StageInfo, StageResult, ExecuteGoalResultDto } from './dto/execute-goal.dto';
import { ToolCapabilityAnalyzerService, ToolCapabilityMap } from './tool-capability-analyzer.service';

/**
 * AI 工作流 Agent 服务
 *
 * 核心能力：
 * 1. 根据用户目标自动分解为多个阶段
 * 2. 为每个阶段动态生成工作流（调用 AI Workflow Builder）
 * 3. 自主执行工作流并监控结果
 * 4. 遇到错误时自动分析并调整策略（Phase 2）
 * 5. 工具能力感知和智能参数映射（Phase 3）
 * 6. 多阶段任务的自动推进
 */
@Injectable()
export class AiWorkflowAgentService {
  private readonly logger = new Logger(AiWorkflowAgentService.name);

  constructor(
    private readonly aiWorkflowBuilder: AiWorkflowBuilderService,
    private readonly workflowExecution: WorkflowExecutionService,
    private readonly llmService: LlmService,
    private readonly toolCapabilityAnalyzer: ToolCapabilityAnalyzerService,
  ) {}

  /**
   * 主入口：自主执行用户目标
   */
  async executeGoal(params: {
    goal: string;
    teamId: string;
    userId: string;
    maxRetries?: number;
    inputParams?: Record<string, any>;
    onProgress?: (event: AgentProgressEvent) => void;
  }): Promise<ExecuteGoalResultDto> {
    const { goal, teamId, userId, maxRetries = 3, inputParams = {}, onProgress } = params;
    const startTime = Date.now();

    this.logger.log(`🎯 [AI Agent] 开始执行目标: ${goal}`);
    this.logger.log(`📋 [AI Agent] 输入参数: ${JSON.stringify(inputParams)}`);

    // Phase 4: 发送开始事件
    onProgress?.({
      type: 'goal_start',
      message: `开始执行目标: ${goal}`,
      goal,
      inputParams,
      timestamp: new Date().toISOString(),
    });

    try {
      // === 阶段 1: 目标分解 ===
      this.logger.log(`\n📊 [AI Agent] 阶段 1: 目标分解...`);
      onProgress?.({
        type: 'decompose_start',
        message: '正在分解目标为多个阶段...',
        timestamp: new Date().toISOString(),
      });

      const stages = await this.decomposeGoal(goal, teamId);

      this.logger.log(`✅ [AI Agent] 目标分解完成，共 ${stages.length} 个阶段:`);
      stages.forEach((stage, i) => {
        this.logger.log(`   ${i + 1}. ${stage.name}: ${stage.description}`);
      });

      onProgress?.({
        type: 'decompose_complete',
        message: `目标分解完成，共 ${stages.length} 个阶段`,
        stages,
        timestamp: new Date().toISOString(),
      });

      // === 阶段 2-N: 逐个执行每个阶段 ===
      const stageResults: StageResult[] = [];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        this.logger.log(`\n🚀 [AI Agent] 执行阶段 ${i + 1}/${stages.length}: ${stage.name}`);

        onProgress?.({
          type: 'stage_start',
          message: `开始执行阶段 ${i + 1}/${stages.length}: ${stage.name}`,
          stageIndex: i,
          totalStages: stages.length,
          stage,
          timestamp: new Date().toISOString(),
        });

        const stageStartTime = Date.now();

        // Phase 2: 带重试的执行
        const result = await this.executeStageWithRetry({
          stage,
          teamId,
          userId,
          inputParams,
          previousResults: stageResults,
          maxRetries,
          onProgress,
        });

        result.duration = Date.now() - stageStartTime;
        stageResults.push(result);

        if (!result.success) {
          this.logger.error(`❌ [AI Agent] 阶段 "${stage.name}" 失败: ${result.error}`);

          onProgress?.({
            type: 'stage_failed',
            message: `阶段 "${stage.name}" 执行失败: ${result.error}`,
            stageIndex: i,
            stage,
            error: result.error,
            timestamp: new Date().toISOString(),
          });

          return {
            success: false,
            stages,
            stageResults,
            error: `阶段 "${stage.name}" 执行失败: ${result.error}`,
            totalDuration: Date.now() - startTime,
          };
        }

        this.logger.log(`✅ [AI Agent] 阶段 "${stage.name}" 完成`);
        onProgress?.({
          type: 'stage_complete',
          message: `阶段 "${stage.name}" 完成`,
          stageIndex: i,
          stage,
          result,
          timestamp: new Date().toISOString(),
        });
      }

      // === 所有阶段完成 ===
      const totalDuration = Date.now() - startTime;
      this.logger.log(`\n🎉 [AI Agent] 目标完成！共执行 ${stageResults.length} 个阶段，耗时 ${totalDuration}ms`);

      onProgress?.({
        type: 'goal_complete',
        message: `目标完成！共执行 ${stageResults.length} 个阶段，耗时 ${totalDuration}ms`,
        stageResults,
        totalDuration,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        stages,
        stageResults,
        totalDuration,
      };
    } catch (error) {
      this.logger.error(`❌ [AI Agent] 执行目标失败: ${error.message}`, error.stack);

      onProgress?.({
        type: 'error',
        message: `执行目标失败: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        error: error.message,
        totalDuration: Date.now() - startTime,
      };
    }
  }

  /**
   * 目标分解：将用户目标分解为多个可执行的阶段
   */
  private async decomposeGoal(goal: string, teamId: string): Promise<StageInfo[]> {
    const systemPrompt = `你是一个工作流专家，擅长将复杂任务分解为可执行的阶段。

你的任务：
1. 分析用户的目标
2. 将其分解为 2-5 个清晰的阶段
3. 每个阶段应该是独立的、可验证的子任务
4. 阶段之间有明确的依赖关系

输出格式（纯 JSON，不要 Markdown 代码块）：
{
  "stages": [
    {
      "name": "阶段名称",
      "description": "详细描述这个阶段要做什么",
      "successCriteria": "如何判断这个阶段成功",
      "tools": ["可能需要的工具列表（可选）"]
    }
  ]
}

示例 1：
用户目标："生成一个浏览器自动化工具并测试上线"
你的输出：
{
  "stages": [
    {
      "name": "代码生成",
      "description": "分析需求，生成 POM 工具的代码（包括核心逻辑、API 接口、测试文件）",
      "successCriteria": "代码文件已创建，语法正确，包含必要的功能",
      "tools": ["third_party_api:list_files", "third_party_api:read_file", "third_party_api:write_file"]
    },
    {
      "name": "单元测试",
      "description": "执行单元测试，确保代码质量",
      "successCriteria": "所有测试通过，代码覆盖率 > 80%",
      "tools": ["third_party_api:run_pytest"]
    },
    {
      "name": "部署上线",
      "description": "更新 manifest.json，重启服务，验证工具可用",
      "successCriteria": "服务重启成功，工具在 API 列表中可见",
      "tools": ["third_party_api:update_manifest", "third_party_api:restart_service"]
    }
  ]
}

示例 2：
用户目标："用 Gemini 3 Pro 和 Jimeng 生成图片"
你的输出：
{
  "stages": [
    {
      "name": "图片生成",
      "description": "使用 Gemini 3 Pro 和 Jimeng 两个模型并行生成图片",
      "successCriteria": "两个模型都成功生成图片",
      "tools": ["gemini_3_pro:generate_image", "jimeng:generate_image"]
    }
  ]
}

注意：
- 如果任务简单（如示例2），可以只有 1 个阶段
- 如果任务复杂（如示例1），可以分解为多个阶段
- 优先考虑并行执行（在同一阶段内使用多个工具）
- 只在必要时才分多个阶段（如：生成代码 → 测试 → 部署）`;

    const userPrompt = `用户目标：${goal}

请分析这个目标，将其分解为清晰的执行阶段。`;

    try {
      this.logger.debug(`[AI Agent] 调用 LLM 进行目标分解...`);

      const content = await this.llmService.generateTextByLlm(teamId, {
        systemPrompt,
        prompt: userPrompt,
        model: config.aiWorkflowBuilder?.model || 'claude-sonnet-4-5-20250929',
        temperature: 0.3,
      });
      this.logger.debug(`[AI Agent] LLM 返回内容: ${content.substring(0, 500)}...`);

      // 尝试提取 JSON（处理可能的 Markdown 代码块包裹）
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }

      const parsed = JSON.parse(jsonContent);

      if (!parsed.stages || !Array.isArray(parsed.stages)) {
        throw new Error('LLM 返回的 JSON 格式不正确：缺少 stages 数组');
      }

      return parsed.stages.map((s: any) => ({
        name: s.name,
        description: s.description,
        successCriteria: s.successCriteria,
        tools: s.tools || [],
      }));
    } catch (error) {
      this.logger.error(`[AI Agent] 目标分解失败: ${error.message}`);
      throw new Error(`目标分解失败: ${error.message}`);
    }
  }

  /**
   * 执行单个阶段（带重试）- Phase 2
   */
  private async executeStageWithRetry(params: {
    stage: StageInfo;
    teamId: string;
    userId: string;
    inputParams: Record<string, any>;
    previousResults: StageResult[];
    maxRetries: number;
    onProgress?: (event: AgentProgressEvent) => void;
  }): Promise<StageResult> {
    const { stage, teamId, userId, inputParams, previousResults, maxRetries, onProgress } = params;

    let lastError: string | undefined;
    let lastWorkflowId: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.logger.log(`   🔄 [AI Agent] 尝试 ${attempt}/${maxRetries}...`);

      if (attempt > 1) {
        onProgress?.({
          type: 'retry',
          message: `重试执行阶段 "${stage.name}"，第 ${attempt}/${maxRetries} 次尝试`,
          stageName: stage.name,
          attempt,
          maxRetries,
          lastError,
          timestamp: new Date().toISOString(),
        });
      }

      try {
        // 1. 为阶段生成工作流（如果是重试，传入错误信息）
        this.logger.log(`   📝 [AI Agent] 生成工作流...`);
        onProgress?.({
          type: 'workflow_generate_start',
          message: `正在为阶段 "${stage.name}" 生成工作流...`,
          stageName: stage.name,
          timestamp: new Date().toISOString(),
        });

        const workflowGenResult = await this.generateWorkflowForStage(
          stage,
          teamId,
          userId,
          inputParams,
          previousResults,
          lastError, // 传入上次的错误信息
          onProgress, // 传递回调
        );

        if (!workflowGenResult.success || !workflowGenResult.workflowId) {
          throw new Error(`工作流生成失败: ${workflowGenResult.error}`);
        }

        lastWorkflowId = workflowGenResult.workflowId;
        this.logger.log(`   ✅ [AI Agent] 工作流生成成功: ${workflowGenResult.workflowId}`);

        onProgress?.({
          type: 'workflow_generate_complete',
          message: `工作流生成成功: ${workflowGenResult.workflowId}`,
          stageName: stage.name,
          workflowId: workflowGenResult.workflowId,
          timestamp: new Date().toISOString(),
        });

        // 2. 执行工作流（启动 + 等待结果）
        this.logger.log(`   ⚙️  [AI Agent] 执行工作流...`);
        onProgress?.({
          type: 'workflow_execute_start',
          message: `开始执行工作流: ${workflowGenResult.workflowId}`,
          stageName: stage.name,
          workflowId: workflowGenResult.workflowId,
          timestamp: new Date().toISOString(),
        });

        const workflowInstanceId = await this.workflowExecution.startWorkflow({
          workflowId: workflowGenResult.workflowId,
          inputData: {
            ...inputParams,
            _agentContext: {
              stage: stage.name,
              previousResults: previousResults.map((r) => r.output),
              attempt,
            },
          },
          teamId,
          userId,
          triggerType: 'MANUALLY' as any,
        });

        // 等待工作流完成
        const executionResult = await this.workflowExecution.waitForWorkflowResult(teamId, workflowInstanceId);

        this.logger.log(`   ℹ️  [AI Agent] 工作流执行状态: ${executionResult.status}`);

        onProgress?.({
          type: 'workflow_status',
          message: `工作流执行状态: ${executionResult.status}`,
          stageName: stage.name,
          workflowInstanceId,
          status: executionResult.status,
          timestamp: new Date().toISOString(),
        });

        // 3. 检查结果
        if (executionResult.status === 'COMPLETED') {
          this.logger.log(`   ✅ [AI Agent] 阶段执行成功！`);
          return {
            success: true,
            stageName: stage.name,
            workflowId: workflowGenResult.workflowId,
            workflowInstanceId: executionResult.workflowInstanceId,
            output: executionResult.output,
            attempts: attempt,
          };
        } else {
          // 工作流失败
          lastError = executionResult.reasonForIncompletion || `工作流状态异常: ${executionResult.status}`;
          this.logger.warn(`   ⚠️  [AI Agent] 工作流执行失败: ${lastError}`);

          onProgress?.({
            type: 'workflow_failed',
            message: `工作流执行失败: ${lastError}`,
            stageName: stage.name,
            error: lastError,
            timestamp: new Date().toISOString(),
          });

          // 如果还有重试机会，分析错误并调整策略
          if (attempt < maxRetries) {
            this.logger.log(`   🔍 [AI Agent] 分析错误并生成修复策略...`);

            onProgress?.({
              type: 'error_analysis_start',
              message: '正在分析错误并生成修复策略...',
              stageName: stage.name,
              error: lastError,
              timestamp: new Date().toISOString(),
            });

            const fixSuggestion = await this.analyzeErrorAndGenerateFix(
              stage,
              lastError,
              executionResult,
              teamId,
            );
            this.logger.log(`   💡 [AI Agent] 修复建议: ${fixSuggestion}`);

            onProgress?.({
              type: 'error_analysis_complete',
              message: `修复建议: ${fixSuggestion}`,
              stageName: stage.name,
              fixSuggestion,
              timestamp: new Date().toISOString(),
            });

            // 将修复建议添加到错误信息中，供下一轮使用
            lastError = `${lastError}\n\n修复建议: ${fixSuggestion}`;

            continue; // 继续下一次重试
          }
        }
      } catch (error) {
        lastError = error.message;
        this.logger.error(`   ❌ [AI Agent] 执行出错: ${error.message}`);

        if (attempt < maxRetries) {
          this.logger.log(`   🔄 [AI Agent] 准备重试...`);
          continue;
        }
      }
    }

    // 所有重试都失败了
    this.logger.error(`   ❌ [AI Agent] 阶段 "${stage.name}" 失败，已达最大重试次数 ${maxRetries}`);
    return {
      success: false,
      stageName: stage.name,
      workflowId: lastWorkflowId,
      error: lastError || '未知错误',
      attempts: maxRetries,
    };
  }

  /**
   * 执行单个阶段（Phase 1: 简单版本，不包含重试）
   * 保留此方法以供参考，实际使用 executeStageWithRetry
   */
  private async executeStage(params: {
    stage: StageInfo;
    teamId: string;
    userId: string;
    inputParams: Record<string, any>;
    previousResults: StageResult[];
  }): Promise<StageResult> {
    const { stage, teamId, userId, inputParams, previousResults } = params;

    try {
      // 1. 为阶段生成工作流
      this.logger.log(`   📝 [AI Agent] 生成工作流...`);
      const workflowGenResult = await this.generateWorkflowForStage(
        stage,
        teamId,
        userId,
        inputParams,
        previousResults
      );

      if (!workflowGenResult.success || !workflowGenResult.workflowId) {
        throw new Error(`工作流生成失败: ${workflowGenResult.error}`);
      }

      this.logger.log(`   ✅ [AI Agent] 工作流生成成功: ${workflowGenResult.workflowId}`);

      // 2. 执行工作流（启动 + 等待结果）
      this.logger.log(`   ⚙️  [AI Agent] 执行工作流...`);
      const workflowInstanceId = await this.workflowExecution.startWorkflow({
        workflowId: workflowGenResult.workflowId,
        inputData: {
          ...inputParams,
          _agentContext: {
            stage: stage.name,
            previousResults: previousResults.map(r => r.output),
          },
        },
        teamId,
        userId,
        triggerType: 'MANUALLY' as any,
      });

      // 等待工作流完成
      const executionResult = await this.workflowExecution.waitForWorkflowResult(teamId, workflowInstanceId);

      this.logger.log(`   ℹ️  [AI Agent] 工作流执行状态: ${executionResult.status}`);

      // 3. 检查结果
      if (executionResult.status === 'COMPLETED') {
        return {
          success: true,
          stageName: stage.name,
          workflowId: workflowGenResult.workflowId,
          workflowInstanceId: executionResult.workflowInstanceId,
          output: executionResult.output,
          attempts: 1,
        };
      } else {
        return {
          success: false,
          stageName: stage.name,
          workflowId: workflowGenResult.workflowId,
          workflowInstanceId: executionResult.workflowInstanceId,
          error: executionResult.reasonForIncompletion || `工作流状态异常: ${executionResult.status}`,
          attempts: 1,
        };
      }
    } catch (error) {
      this.logger.error(`   ❌ [AI Agent] 阶段执行出错: ${error.message}`);
      return {
        success: false,
        stageName: stage.name,
        error: error.message,
        attempts: 1,
      };
    }
  }

  /**
   * 为阶段生成工作流
   */
  private async generateWorkflowForStage(
    stage: StageInfo,
    teamId: string,
    userId: string,
    inputParams: Record<string, any>,
    previousResults: StageResult[],
    lastError?: string, // Phase 2: 添加错误信息参数
    onProgress?: (event: AgentProgressEvent) => void, // Phase 4: 添加进度回调
  ) {
    // 构建描述，包含：
    // 1. 阶段目标
    // 2. 用户输入参数
    // 3. 前面阶段的结果（上下文）
    // 4. 如果是重试，包含上次的错误信息
    let description = `${stage.description}\n\n成功标准: ${stage.successCriteria}`;

    // 添加用户输入参数信息
    if (Object.keys(inputParams).length > 0) {
      description += `\n\n用户输入参数:\n`;
      description += JSON.stringify(inputParams, null, 2);
    }

    // 添加前面阶段的结果
    if (previousResults.length > 0) {
      description += `\n\n前面阶段的结果:\n`;
      previousResults.forEach((result, i) => {
        description += `- 阶段 ${i + 1} (${result.stageName}): `;
        if (result.success) {
          description += `成功\n`;
          if (result.output) {
            description += `  输出: ${JSON.stringify(result.output).substring(0, 200)}\n`;
          }
        } else {
          description += `失败 - ${result.error}\n`;
        }
      });
    }

    // 添加建议的工具
    if (stage.tools && stage.tools.length > 0) {
      description += `\n\n建议使用的工具: ${stage.tools.join(', ')}`;
    }

    // Phase 3: 分析工具能力并添加到描述中
    if (stage.tools && stage.tools.length > 0) {
      try {
        this.logger.log(`   🔍 [AI Agent] 分析 ${stage.tools.length} 个工具的能力...`);

        onProgress?.({
          type: 'tool_analysis_start',
          message: `正在分析 ${stage.tools.length} 个工具的能力...`,
          stageName: stage.name,
          tools: stage.tools,
          timestamp: new Date().toISOString(),
        });

        const toolCapabilities = await this.toolCapabilityAnalyzer.analyzeToolCapabilities(
          stage.tools,
          teamId,
        );

        if (Object.keys(toolCapabilities).length > 0) {
          const capabilitySummary =
            this.toolCapabilityAnalyzer.generateCapabilitySummary(toolCapabilities);
          description += `\n\n${capabilitySummary}`;
          this.logger.log(
            `   ✅ [AI Agent] 工具能力分析完成，共 ${Object.keys(toolCapabilities).length} 个工具`,
          );

          onProgress?.({
            type: 'tool_analysis_complete',
            message: `工具能力分析完成，共 ${Object.keys(toolCapabilities).length} 个工具`,
            stageName: stage.name,
            toolCapabilities,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.warn(`   ⚠️  [AI Agent] 工具能力分析失败: ${error.message}`);

        onProgress?.({
          type: 'tool_analysis_failed',
          message: `工具能力分析失败: ${error.message}`,
          stageName: stage.name,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Phase 2: 如果是重试，添加错误信息和修复建议
    if (lastError) {
      description += `\n\n⚠️ 上次执行失败，错误信息:\n${lastError}\n\n请根据错误信息调整工作流，避免相同的错误。`;
    }

    this.logger.debug(`[AI Agent] 工作流描述:\n${description}`);

    // 调用 AI Workflow Builder 生成工作流
    const workflowName = `ai_agent_${stage.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    return await this.aiWorkflowBuilder.generateWorkflow(
      {
        name: workflowName,
        description,
        autoActivate: true,
      },
      teamId,
      userId
    );
  }

  /**
   * 分析错误并生成修复建议（Phase 2）
   */
  private async analyzeErrorAndGenerateFix(
    stage: StageInfo,
    error: string,
    executionResult: any,
    teamId: string,
  ): Promise<string> {
    const systemPrompt = `你是一个工作流调试专家，擅长分析工作流执行失败的原因并提供修复建议。

你的任务：
1. 分析工作流执行失败的错误信息
2. 理解失败的根本原因
3. 提供具体的修复建议，用于重新生成工作流

输出格式（纯文本，不要 JSON）：
简洁的修复建议（1-3 句话），说明应该如何调整工作流。

示例 1：
错误：Tool "gemini_3_pro:generate_image" not found
修复建议：工具名称错误，应该使用 "gemini__generate_image"（注意双下划线）。

示例 2：
错误：Required parameter "prompt" is missing
修复建议：工具调用缺少必需参数 "prompt"，确保在 inputParameters 中传递 prompt 参数。

示例 3：
错误：Task execution timeout after 120000ms
修复建议：任务执行超时，可能是因为图片生成时间过长，建议增加 timeout 配置或使用更快的模型。`;

    const userPrompt = `阶段信息：
- 阶段名称：${stage.name}
- 阶段描述：${stage.description}

错误信息：
${error}

工作流执行结果：
${JSON.stringify(executionResult, null, 2).substring(0, 1000)}

请分析这个错误并提供修复建议。`;

    try {
      const suggestion = await this.llmService.generateTextByLlm(teamId, {
        systemPrompt,
        prompt: userPrompt,
        model: config.aiWorkflowBuilder?.model || 'claude-sonnet-4-5-20250929',
        temperature: 0.3,
      });

      return suggestion.trim();
    } catch (err) {
      this.logger.error(`[AI Agent] 错误分析失败: ${err.message}`);
      return '无法生成修复建议，请检查错误信息并手动调整。';
    }
  }
}

// ==================== Phase 4: SSE 事件类型定义 ====================

export type AgentProgressEvent =
  | {
      type: 'goal_start';
      message: string;
      goal: string;
      inputParams: Record<string, any>;
      timestamp: string;
    }
  | {
      type: 'decompose_start';
      message: string;
      timestamp: string;
    }
  | {
      type: 'decompose_complete';
      message: string;
      stages: StageInfo[];
      timestamp: string;
    }
  | {
      type: 'stage_start';
      message: string;
      stageIndex: number;
      totalStages: number;
      stage: StageInfo;
      timestamp: string;
    }
  | {
      type: 'stage_complete';
      message: string;
      stageIndex: number;
      stage: StageInfo;
      result: StageResult;
      timestamp: string;
    }
  | {
      type: 'stage_failed';
      message: string;
      stageIndex: number;
      stage: StageInfo;
      error: string;
      timestamp: string;
    }
  | {
      type: 'retry';
      message: string;
      stageName: string;
      attempt: number;
      maxRetries: number;
      lastError?: string;
      timestamp: string;
    }
  | {
      type: 'workflow_generate_start';
      message: string;
      stageName: string;
      timestamp: string;
    }
  | {
      type: 'workflow_generate_complete';
      message: string;
      stageName: string;
      workflowId: string;
      timestamp: string;
    }
  | {
      type: 'workflow_execute_start';
      message: string;
      stageName: string;
      workflowId: string;
      timestamp: string;
    }
  | {
      type: 'workflow_status';
      message: string;
      stageName: string;
      workflowInstanceId: string;
      status: string;
      timestamp: string;
    }
  | {
      type: 'workflow_failed';
      message: string;
      stageName: string;
      error: string;
      timestamp: string;
    }
  | {
      type: 'tool_analysis_start';
      message: string;
      stageName: string;
      tools: string[];
      timestamp: string;
    }
  | {
      type: 'tool_analysis_complete';
      message: string;
      stageName: string;
      toolCapabilities: any;
      timestamp: string;
    }
  | {
      type: 'tool_analysis_failed';
      message: string;
      stageName: string;
      error: string;
      timestamp: string;
    }
  | {
      type: 'error_analysis_start';
      message: string;
      stageName: string;
      error: string;
      timestamp: string;
    }
  | {
      type: 'error_analysis_complete';
      message: string;
      stageName: string;
      fixSuggestion: string;
      timestamp: string;
    }
  | {
      type: 'goal_complete';
      message: string;
      stageResults: StageResult[];
      totalDuration: number;
      timestamp: string;
    }
  | {
      type: 'error';
      message: string;
      error: string;
      timestamp: string;
    };
