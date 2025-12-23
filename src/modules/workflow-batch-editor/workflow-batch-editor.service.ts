import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowSearchService } from './workflow-search.service';
import { ParameterUpdaterService } from './parameter-updater.service';
import { AiParserService } from './ai-parser.service';
import { WorkflowValidateService } from '../workflow/workflow.validate.service';
import { ConductorService } from '../workflow/conductor/conductor.service';
import {
  BatchRenameDto,
  BatchRenameResultDto,
} from './dto/batch-rename.dto';
import {
  BatchUpdateParametersDto,
  BatchUpdateParametersResultDto,
} from './dto/batch-update-params.dto';
import {
  AiAssistedBatchEditDto,
  AiAssistedBatchEditResultDto,
  BatchEditOperationType,
} from './dto/ai-assisted-edit.dto';

/**
 * 工作流批量编辑服务
 * 提供批量重命名、批量修改参数、AI辅助编辑等功能
 */
@Injectable()
export class WorkflowBatchEditorService {
  private readonly logger = new Logger(WorkflowBatchEditorService.name);

  constructor(
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowRepository: Repository<WorkflowMetadataEntity>,
    private readonly workflowSearchService: WorkflowSearchService,
    private readonly parameterUpdaterService: ParameterUpdaterService,
    private readonly aiParserService: AiParserService,
    private readonly workflowValidateService: WorkflowValidateService,
    private readonly conductorService: ConductorService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 批量重命名工作流
   */
  async batchRenameWorkflows(
    teamId: string,
    userId: string,
    dto: BatchRenameDto,
  ): Promise<BatchRenameResultDto> {
    this.logger.log(`批量重命名工作流: teamId=${teamId}, dryRun=${dto.dryRun}`);

    // 1. 搜索匹配的工作流
    const workflows = await this.workflowSearchService.searchWorkflows(teamId, dto.filter);
    this.logger.log(`找到 ${workflows.length} 个匹配的工作流`);

    if (workflows.length === 0) {
      return {
        affectedWorkflows: [],
        totalAffected: 0,
        isDryRun: dto.dryRun || true,
      };
    }

    // 2. 预览重命名结果
    const affectedWorkflows = workflows.map((workflow) => {
      const { updatedWorkflow, oldDisplayName, newDisplayName } = this.parameterUpdaterService.renameWorkflow(
        workflow,
        dto.renamePattern,
      );

      return {
        workflowId: workflow.workflowId,
        recordId: workflow.id,
        oldDisplayName,
        newDisplayName,
        version: updatedWorkflow.version,
      };
    });

    // 3. 如果是预览模式，直接返回
    if (dto.dryRun !== false) {
      this.logger.log('预览模式，不实际修改');
      return {
        affectedWorkflows,
        totalAffected: affectedWorkflows.length,
        isDryRun: true,
      };
    }

    // 4. 执行批量重命名（使用事务）
    this.logger.log('开始执行批量重命名...');
    const executionResult = await this.executeBatchRename(teamId, workflows, dto.renamePattern);

    return {
      affectedWorkflows,
      totalAffected: affectedWorkflows.length,
      isDryRun: false,
      executionResult,
    };
  }

  /**
   * 批量更新工作流参数
   */
  async batchUpdateParameters(
    teamId: string,
    userId: string,
    dto: BatchUpdateParametersDto,
  ): Promise<BatchUpdateParametersResultDto> {
    this.logger.log(`批量更新参数: teamId=${teamId}, dryRun=${dto.dryRun}`);

    // 1. 搜索匹配的工作流
    const workflows = await this.workflowSearchService.searchWorkflows(teamId, dto.filter);
    this.logger.log(`找到 ${workflows.length} 个匹配的工作流`);

    if (workflows.length === 0) {
      return {
        previewChanges: [],
        totalAffected: 0,
        totalParameterChanges: 0,
        isDryRun: dto.dryRun !== false,
      };
    }

    // 2. 预览参数修改
    const previewChanges = [];
    let totalParameterChanges = 0;

    for (const workflow of workflows) {
      const { updatedWorkflow, changes } = this.parameterUpdaterService.updateWorkflowParameters(
        workflow,
        dto.parameterUpdates,
        dto.filter,
      );

      if (changes.length > 0) {
        // 如果需要自动验证
        let validationIssues = undefined;
        if (dto.autoValidate !== false) {
          const issues = await this.workflowValidateService.validateWorkflow(
            teamId,
            updatedWorkflow.tasks || [],
            updatedWorkflow.output || [],
          );
          if (issues.length > 0) {
            validationIssues = issues.map((issue) => ({
              taskReferenceName: issue.taskReferenceName,
              issueType: issue.issueType,
              message: issue.humanMessage?.zh || issue.humanMessage?.en || 'Unknown issue',
            }));
          }
        }

        previewChanges.push({
          workflowId: workflow.workflowId,
          recordId: workflow.id,
          workflowName: this.getWorkflowDisplayName(workflow),
          version: updatedWorkflow.version,
          changes,
          validationIssues,
        });

        totalParameterChanges += changes.length;
      }
    }

    // 3. 如果是预览模式，直接返回
    if (dto.dryRun !== false) {
      this.logger.log('预览模式，不实际修改');
      return {
        previewChanges,
        totalAffected: previewChanges.length,
        totalParameterChanges,
        isDryRun: true,
      };
    }

    // 4. 执行批量更新（使用事务）
    this.logger.log('开始执行批量更新...');
    const executionResult = await this.executeBatchUpdateParameters(teamId, workflows, dto);

    return {
      previewChanges,
      totalAffected: previewChanges.length,
      totalParameterChanges,
      isDryRun: false,
      executionResult,
    };
  }

  /**
   * AI 辅助批量编辑
   */
  async aiAssistedBatchEdit(
    teamId: string,
    userId: string,
    dto: AiAssistedBatchEditDto,
  ): Promise<AiAssistedBatchEditResultDto> {
    this.logger.log(`AI 辅助批量编辑: ${dto.naturalLanguageRequest}`);

    // 1. AI 解析自然语言请求
    const { parsedPlan, rawResponse } = await this.aiParserService.parseNaturalLanguageRequest(
      dto.naturalLanguageRequest,
      teamId,
    );

    this.logger.log(`AI 解析结果: ${parsedPlan.operationType}, 置信度: ${parsedPlan.confidence}`);

    // 2. 根据操作类型执行相应操作
    let previewChanges = [];
    let totalAffected = 0;
    let executionResult = undefined;

    switch (parsedPlan.operationType) {
      case BatchEditOperationType.RENAME:
        const renameResult = await this.executeAiRename(teamId, userId, parsedPlan, dto.dryRun !== false);
        previewChanges = renameResult.previewChanges;
        totalAffected = renameResult.totalAffected;
        executionResult = renameResult.executionResult;
        break;

      case BatchEditOperationType.UPDATE_PARAMS:
        const updateResult = await this.executeAiUpdateParams(teamId, userId, parsedPlan, dto.dryRun !== false);
        previewChanges = updateResult.previewChanges;
        totalAffected = updateResult.totalAffected;
        executionResult = updateResult.executionResult;
        break;

      case BatchEditOperationType.MIXED:
        // TODO: 支持混合操作
        throw new Error('混合操作暂未实现');

      default:
        throw new Error(`不支持的操作类型: ${parsedPlan.operationType}`);
    }

    // 3. 返回结果
    const result: AiAssistedBatchEditResultDto = {
      parsedPlan,
      previewChanges,
      totalAffected,
      isDryRun: dto.dryRun !== false,
      executionResult,
    };

    // 4. 如果需要详细信息
    if (dto.includeParsingDetails) {
      result.parsingDetails = {
        rawLlmResponse: rawResponse,
        extractedIntent: parsedPlan.reasoning || '',
        toolsAnalyzed: [],
      };
    }

    return result;
  }

  /**
   * 执行 AI 解析的重命名操作
   */
  private async executeAiRename(
    teamId: string,
    userId: string,
    parsedPlan: any,
    dryRun: boolean,
  ): Promise<any> {
    // 构造重命名 DTO
    const renameOp = parsedPlan.operations.find((op: any) => op.type === 'rename');
    if (!renameOp) {
      throw new Error('AI 解析结果中没有重命名操作');
    }

    const batchRenameDto: BatchRenameDto = {
      filter: parsedPlan.filter,
      renamePattern: {
        search: renameOp.oldValue || '',
        replace: renameOp.newValue || '',
        useRegex: false,
        caseSensitive: false,
      },
      dryRun,
    };

    const result = await this.batchRenameWorkflows(teamId, userId, batchRenameDto);

    // 转换为统一格式
    return {
      previewChanges: result.affectedWorkflows.map((item) => ({
        workflowId: item.workflowId,
        recordId: item.recordId,
        workflowName: this.getDisplayNameString(item.oldDisplayName),
        changes: [
          {
            field: 'displayName',
            before: item.oldDisplayName,
            after: item.newDisplayName,
          },
        ],
      })),
      totalAffected: result.totalAffected,
      executionResult: result.executionResult,
    };
  }

  /**
   * 执行 AI 解析的参数更新操作
   */
  private async executeAiUpdateParams(
    teamId: string,
    userId: string,
    parsedPlan: any,
    dryRun: boolean,
  ): Promise<any> {
    // 构造参数更新 DTO
    const paramOps = parsedPlan.operations.filter((op: any) => op.type === 'update_param');
    if (paramOps.length === 0) {
      throw new Error('AI 解析结果中没有参数更新操作');
    }

    const batchUpdateDto: BatchUpdateParametersDto = {
      filter: parsedPlan.filter,
      parameterUpdates: paramOps.map((op: any) => ({
        parameterName: op.target,
        newValue: op.newValue,
        mode: op.mode || 'override',
        targetTaskReferenceName: op.targetTaskReferenceName,
      })),
      dryRun,
      autoValidate: true,
    };

    const result = await this.batchUpdateParameters(teamId, userId, batchUpdateDto);

    // 转换为统一格式
    return {
      previewChanges: result.previewChanges.map((item) => ({
        workflowId: item.workflowId,
        recordId: item.recordId,
        workflowName: item.workflowName,
        changes: item.changes.map((change) => ({
          field: `${change.taskReferenceName}.${change.parameterName}`,
          before: change.before,
          after: change.after,
        })),
      })),
      totalAffected: result.totalAffected,
      executionResult: result.executionResult,
    };
  }

  /**
   * 执行批量重命名（带事务）
   */
  private async executeBatchRename(
    teamId: string,
    workflows: WorkflowMetadataEntity[],
    renamePattern: any,
  ): Promise<{ successCount: number; failedCount: number; errors: Array<{ workflowId: string; error: string }> }> {
    const errors: Array<{ workflowId: string; error: string }> = [];
    let successCount = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const workflow of workflows) {
        try {
          const { updatedWorkflow } = this.parameterUpdaterService.renameWorkflow(workflow, renamePattern);

          // 保存到数据库
          await manager.save(WorkflowMetadataEntity, updatedWorkflow);

          // 更新 Conductor
          await this.conductorService.saveWorkflowInConductor(updatedWorkflow);

          successCount++;
          this.logger.debug(`成功重命名工作流: ${workflow.workflowId}`);
        } catch (error) {
          this.logger.error(`重命名工作流失败: ${workflow.workflowId}, error: ${error.message}`);
          errors.push({ workflowId: workflow.workflowId, error: error.message });
          throw error; // 触发事务回滚
        }
      }
    });

    return {
      successCount,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 执行批量更新参数（带事务）
   */
  private async executeBatchUpdateParameters(
    teamId: string,
    workflows: WorkflowMetadataEntity[],
    dto: BatchUpdateParametersDto,
  ): Promise<{ successCount: number; failedCount: number; errors: Array<{ workflowId: string; error: string }> }> {
    const errors: Array<{ workflowId: string; error: string }> = [];
    let successCount = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const workflow of workflows) {
        try {
          const { updatedWorkflow } = this.parameterUpdaterService.updateWorkflowParameters(
            workflow,
            dto.parameterUpdates,
            dto.filter,
          );

          // 如果需要验证
          if (dto.autoValidate !== false) {
            const issues = await this.workflowValidateService.validateWorkflow(
              teamId,
              updatedWorkflow.tasks || [],
              updatedWorkflow.output || [],
            );

            const errors = issues.filter((issue) => issue.issueType === 'ERROR');
            if (errors.length > 0) {
              throw new Error(`工作流验证失败: ${errors.map((e) => e.humanMessage?.zh || e.humanMessage?.en).join(', ')}`);
            }
          }

          // 保存到数据库
          await manager.save(WorkflowMetadataEntity, updatedWorkflow);

          // 更新 Conductor
          await this.conductorService.saveWorkflowInConductor(updatedWorkflow);

          successCount++;
          this.logger.debug(`成功更新工作流: ${workflow.workflowId}`);
        } catch (error) {
          this.logger.error(`更新工作流失败: ${workflow.workflowId}, error: ${error.message}`);
          errors.push({ workflowId: workflow.workflowId, error: error.message });
          throw error; // 触发事务回滚
        }
      }
    });

    return {
      successCount,
      failedCount: errors.length,
      errors,
    };
  }

  /**
   * 获取工作流显示名称
   */
  private getWorkflowDisplayName(workflow: WorkflowMetadataEntity): string {
    return this.getDisplayNameString(workflow.displayName);
  }

  /**
   * 从 I18nValue 或字符串获取显示名称
   */
  private getDisplayNameString(displayName: any): string {
    if (typeof displayName === 'string') {
      return displayName;
    }
    return displayName?.zh || displayName?.en || 'Unknown Workflow';
  }
}
