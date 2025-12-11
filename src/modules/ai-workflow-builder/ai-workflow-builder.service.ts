import { Injectable, Logger } from '@nestjs/common';
import { config } from '@/common/config';
import { ToolsCatalogService } from './tools-catalog.service';
import { PromptBuilderService } from './prompt-builder.service';
import { LlmService } from '../tools/llm/llm.service';
import { WorkflowCrudService } from '../workflow/workflow.curd.service';
import { WorkflowValidateService } from '../workflow/workflow.validate.service';
import { WorkflowValidatorService } from './workflow-validator.service';
import { WorkflowDescriptor, BatchGenerateSameDto, BatchGenerateDifferentDto, GenerateWorkflowDto } from './dto/generate-workflow.dto';
import { WorkflowGenerationResult, BatchGenerationResult } from './dto/workflow-generation-result.dto';
import { SmartRouterService } from './smart-router.service';

/**
 * AI 工作流生成服务
 * 核心功能：根据自然语言描述生成工作流，支持单个和批量生成
 */
@Injectable()
export class AiWorkflowBuilderService {
  private readonly logger = new Logger(AiWorkflowBuilderService.name);

  constructor(
    private readonly toolsCatalogService: ToolsCatalogService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly llmService: LlmService,
    private readonly workflowCurdService: WorkflowCrudService,
    private readonly workflowValidateService: WorkflowValidateService,
    private readonly workflowValidatorService: WorkflowValidatorService,
    private readonly smartRouter: SmartRouterService,
  ) {}

  /**
   * 生成单个工作流
   */
  async generateWorkflow(dto: GenerateWorkflowDto, teamId: string, userId: string): Promise<WorkflowGenerationResult> {
    try {
      this.logger.log(`开始生成工作流: ${dto.description}`);

      // 1. 获取可用工具清单
      const allTools = await this.toolsCatalogService.getAllToolsForAI(teamId);
      this.logger.debug(`获取到 ${allTools.length} 个可用工具`);

      // 2. 智能筛选相关工具（减少 token 使用）
      const tools = this.toolsCatalogService.filterRelevantTools(allTools, dto.description);
      this.logger.log(`筛选后保留 ${tools.length} 个相关工具`);

      // 3. 构建提示词（传入用户描述以匹配场景模板）
      const systemPrompt = await this.promptBuilderService.buildSystemPrompt(tools, dto.description);
      const userPrompt = this.promptBuilderService.buildUserPrompt(dto.description, dto.name);

      // 4. 调用 LLM 生成工作流 JSON
      this.logger.log('调用 LLM 生成工作流 JSON...');
      const workflowJson = await this.callLLMToGenerateWorkflow(systemPrompt, userPrompt, teamId);

      // 5. 解析 JSON
      let workflow: any;
      try {
        workflow = JSON.parse(workflowJson);
      } catch (error) {
        throw new Error(`生成的 JSON 无法解析: ${error.message}\n${workflowJson}`);
      }

      // 6. 使用新验证器自动修复常见错误
      this.logger.log('使用 WorkflowValidatorService 验证并自动修复...');
      const validationResult = this.workflowValidatorService.validateAndFix(workflow, tools);

      // 使用修复后的工作流
      workflow = validationResult.fixed;

      // 记录警告和错误
      if (validationResult.warnings.length > 0) {
        this.logger.warn(`自动修复了 ${validationResult.warnings.length} 个问题:`);
        validationResult.warnings.forEach((warning) => this.logger.warn(`  - ${warning}`));
      }

      if (!validationResult.isValid) {
        this.logger.error(`验证失败，有 ${validationResult.errors.length} 个错误:`);
        validationResult.errors.forEach((error) => this.logger.error(`  - ${error}`));
        throw new Error(`工作流验证失败: ${validationResult.errors.join('; ')}`);
      }

      // 7. 验证工作流（使用现有的验证服务进行二次验证）
      this.logger.log('进行最终验证...');
      const issues = await this.workflowValidateService.validateWorkflow(teamId, workflow.tasks || [], workflow.output || []);

      // 6. 如果有错误，尝试修复
      const errors = issues.filter((issue) => issue.issueType === 'ERROR');
      if (errors.length > 0) {
        this.logger.warn(`工作流有 ${errors.length} 个错误，尝试修复...`);
        workflow = await this.fixWorkflow(workflow, errors, teamId);

        // 重新验证
        const revalidateIssues = await this.workflowValidateService.validateWorkflow(teamId, workflow.tasks || [], workflow.output || []);
        const stillHasErrors = revalidateIssues.filter((issue) => issue.issueType === 'ERROR');
        if (stillHasErrors.length > 0) {
          this.logger.error('修复后仍有错误');
          throw new Error(`工作流验证失败: ${JSON.stringify(stillHasErrors)}`);
        }
      }

      // 7. 创建工作流
      this.logger.log('创建工作流到数据库...');
      const workflowId = await this.workflowCurdService.createWorkflowDef(teamId, userId, {
        ...workflow,
        activated: dto.autoActivate !== false,
      });

      this.logger.log(`✅ 工作流创建成功: ${workflowId}`);

      return {
        success: true,
        workflowId: workflowId,
        displayName: workflow.displayName,
        name: dto.name,
        warnings: issues.filter((issue) => issue.issueType === 'WANRING'),
      };
    } catch (error) {
      this.logger.error(`工作流生成失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        name: dto.name,
      };
    }
  }

  /**
   * 批量生成相同的工作流（模式A）
   */
  async batchGenerateSame(dto: BatchGenerateSameDto, teamId: string, userId: string): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    this.logger.log(`开始批量生成 ${dto.count} 个相同工作流`);

    const results: WorkflowGenerationResult[] = [];

    try {
      // 1. 先生成一个基础工作流 JSON
      const allTools = await this.toolsCatalogService.getAllToolsForAI(teamId);
      const tools = this.toolsCatalogService.filterRelevantTools(allTools, dto.description);
      this.logger.log(`筛选后保留 ${tools.length} 个相关工具`);

      const systemPrompt = await this.promptBuilderService.buildSystemPrompt(tools, dto.description);
      const userPrompt = this.promptBuilderService.buildUserPrompt(dto.description);

      this.logger.log('生成基础工作流 JSON...');
      const baseWorkflowJson = await this.callLLMToGenerateWorkflow(systemPrompt, userPrompt, teamId);
      const baseWorkflow = JSON.parse(baseWorkflowJson);

      // 使用新验证器自动修复
      this.logger.log('验证并自动修复基础工作流...');
      const validationResult = this.workflowValidatorService.validateAndFix(baseWorkflow, tools);

      if (!validationResult.isValid) {
        throw new Error(`基础工作流验证失败: ${validationResult.errors.join('; ')}`);
      }

      // 使用修复后的工作流
      const fixedBaseWorkflow = validationResult.fixed;

      if (validationResult.warnings.length > 0) {
        this.logger.warn(`自动修复了 ${validationResult.warnings.length} 个问题`);
      }

      // 2. 验证基础工作流（二次验证）
      const baseIssues = await this.workflowValidateService.validateWorkflow(teamId, fixedBaseWorkflow.tasks || [], fixedBaseWorkflow.output || []);

      const baseErrors = baseIssues.filter((issue) => issue.issueType === 'ERROR');
      if (baseErrors.length > 0) {
        this.logger.warn('基础工作流有错误，尝试修复...');
        const fixed = await this.fixWorkflow(fixedBaseWorkflow, baseErrors, teamId);
        Object.assign(fixedBaseWorkflow, fixed);
      }

      // 3. 批量创建（复制 count 次）
      for (let i = 1; i <= dto.count; i++) {
        try {
          const namingPattern = dto.namingPattern || '{index}';
          const workflowName = namingPattern.replace('{index}', i.toString());

          const workflow = {
            ...fixedBaseWorkflow,
            displayName: `${fixedBaseWorkflow.displayName} ${i}`,
            description: fixedBaseWorkflow.description || dto.description,
          };

          const workflowId = await this.workflowCurdService.createWorkflowDef(teamId, userId, {
            ...workflow,
            activated: dto.autoActivate !== false,
          });

          results.push({
            success: true,
            workflowId: workflowId,
            name: workflowName,
            displayName: workflow.displayName,
          });

          this.logger.log(`✅ [${i}/${dto.count}] 创建成功: ${workflowId}`);
        } catch (error) {
          this.logger.error(`❌ [${i}/${dto.count}] 创建失败: ${error.message}`);
          results.push({
            success: false,
            error: error.message,
            name: `workflow_${i}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(`批量生成失败: ${error.message}`, error.stack);
      // 如果基础工作流生成失败，所有都标记为失败
      for (let i = 1; i <= dto.count; i++) {
        results.push({
          success: false,
          error: `基础工作流生成失败: ${error.message}`,
          name: `workflow_${i}`,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    this.logger.log(`批量生成完成: 总数 ${dto.count}, 成功 ${successCount}, 失败 ${dto.count - successCount}, 耗时 ${duration}ms`);

    return {
      total: dto.count,
      success: successCount,
      failed: dto.count - successCount,
      results,
      duration,
    };
  }

  /**
   * 批量生成不同的工作流（模式B）
   */
  async batchGenerateDifferent(dto: BatchGenerateDifferentDto, teamId: string, userId: string): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    const total = dto.workflows.length;

    this.logger.log(`开始批量生成 ${total} 个不同工作流`);

    // 并行生成所有工作流
    const results = await Promise.all(
      dto.workflows.map(async (item: WorkflowDescriptor, index: number) => {
        try {
          this.logger.log(`[${index + 1}/${total}] 生成: ${item.name}`);

          const result = await this.generateWorkflow(
            {
              description: item.description,
              name: item.name,
              autoActivate: dto.autoActivate,
            },
            teamId,
            userId,
          );

          if (result.success) {
            this.logger.log(`✅ [${index + 1}/${total}] ${item.name} 成功`);
          } else {
            this.logger.error(`❌ [${index + 1}/${total}] ${item.name} 失败: ${result.error}`);
          }

          return result;
        } catch (error) {
          this.logger.error(`❌ [${index + 1}/${total}] ${item.name} 异常: ${error.message}`);
          return {
            success: false,
            error: error.message,
            name: item.name,
          };
        }
      }),
    );

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    this.logger.log(`批量生成完成: 总数 ${total}, 成功 ${successCount}, 失败 ${total - successCount}, 耗时 ${duration}ms`);

    return {
      total,
      success: successCount,
      failed: total - successCount,
      results,
      duration,
    };
  }

  /**
   * 调用 LLM 生成工作流 JSON
   */
  private async callLLMToGenerateWorkflow(systemPrompt: string, userPrompt: string, teamId: string): Promise<string> {
    try {
      // 从配置文件读取模型配置（config.yaml 中的 aiWorkflowBuilder.model）
      const model = config.aiWorkflowBuilder.model;

      const response = await this.llmService.generateTextByLlm(teamId, {
        systemPrompt,
        prompt: userPrompt,
        model, // 使用配置的模型
        temperature: 0.3, // 降低随机性
        maxTokens: 4000,
        // 注意：如果你的 LLM 服务支持 responseFormat，可以指定为 'json_object'
        // responseFormat: 'json_object',
      });

      // 提取 JSON（去除可能的 markdown 代码块标记）
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\n/, '').replace(/\n```$/, '');
      }

      return jsonStr;
    } catch (error) {
      this.logger.error(`LLM 调用失败: ${error.message}`, error.stack);
      throw new Error(`LLM 调用失败: ${error.message}`);
    }
  }

  /**
   * 修复工作流验证错误
   */
  private async fixWorkflow(workflow: any, issues: any[], teamId: string): Promise<any> {
    this.logger.log('尝试修复工作流验证错误...');

    const fixPrompt = this.promptBuilderService.buildFixPrompt(workflow, issues);

    const fixedJson = await this.callLLMToGenerateWorkflow('你是工作流修复专家，请根据验证错误修复工作流 JSON。', fixPrompt, teamId);

    return JSON.parse(fixedJson);
  }

  /**
   * 智能批量生成工作流（模板优先 + AI兜底）
   * 这是Phase 1的核心功能
   */
  async batchGenerateSmart(dto: BatchGenerateDifferentDto, teamId: string, userId: string): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    const total = dto.workflows.length;

    this.logger.log(`🚀 开始智能批量生成 ${total} 个工作流（模板优先策略）`);

    const results: WorkflowGenerationResult[] = [];
    let templateGeneratedCount = 0;
    let aiGeneratedCount = 0;

    // 顺序处理每个工作流（未来可优化为并行）
    for (let i = 0; i < dto.workflows.length; i++) {
      const item = dto.workflows[i];
      try {
        this.logger.log(`[${i + 1}/${total}] 处理: ${item.name}`);

        // 1. 智能路由决策
        const method = await this.smartRouter.route(item.description);

        let result: WorkflowGenerationResult;

        // 2. 根据路由结果选择生成方式
        if (method === 'template') {
          // 使用模板生成
          this.logger.log(`  → 使用模板生成`);
          const matchResult = await this.smartRouter.findBestTemplateMatch(item.description);

          if (matchResult) {
            const templateResult = await this.smartRouter.generateFromTemplate(
              matchResult.template,
              item.description,
              item.name,
              teamId,
              userId,
            );

            result = {
              success: true,
              workflowId: templateResult.workflowId,
              displayName: templateResult.displayName,
              name: item.name,
            };

            templateGeneratedCount++;
          } else {
            // 降级到AI（不应该发生，但保险起见）
            this.logger.warn(`  → 模板匹配失败，降级到AI生成`);
            result = await this.generateWorkflow(
              {
                description: item.description,
                name: item.name,
                autoActivate: dto.autoActivate,
              },
              teamId,
              userId,
            );
            aiGeneratedCount++;
          }
        } else {
          // 使用AI生成
          this.logger.log(`  → 使用AI生成`);
          result = await this.generateWorkflow(
            {
              description: item.description,
              name: item.name,
              autoActivate: dto.autoActivate,
            },
            teamId,
            userId,
          );
          aiGeneratedCount++;
        }

        results.push(result);

        if (result.success) {
          this.logger.log(`  ✅ [${i + 1}/${total}] ${item.name} 成功 (方法: ${method})`);
        } else {
          this.logger.error(`  ❌ [${i + 1}/${total}] ${item.name} 失败: ${result.error}`);
        }
      } catch (error) {
        this.logger.error(`  ❌ [${i + 1}/${total}] ${item.name} 异常: ${error.message}`);
        results.push({
          success: false,
          error: error.message,
          name: item.name,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    this.logger.log(
      `\n📊 批量生成完成统计:\n` +
        `  总数: ${total}\n` +
        `  成功: ${successCount}\n` +
        `  失败: ${total - successCount}\n` +
        `  模板生成: ${templateGeneratedCount}\n` +
        `  AI生成: ${aiGeneratedCount}\n` +
        `  耗时: ${duration}ms`,
    );

    return {
      total,
      success: successCount,
      failed: total - successCount,
      results,
      duration,
    };
  }
}
