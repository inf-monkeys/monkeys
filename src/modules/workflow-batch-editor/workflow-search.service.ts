import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { WorkflowFilterDto } from './dto/workflow-filter.dto';

/**
 * 工作流搜索服务
 * 提供灵活的工作流搜索能力
 */
@Injectable()
export class WorkflowSearchService {
  private readonly logger = new Logger(WorkflowSearchService.name);

  constructor(
    @InjectRepository(WorkflowMetadataEntity)
    private readonly workflowRepository: Repository<WorkflowMetadataEntity>,
  ) {}

  /**
   * 根据过滤条件搜索工作流
   */
  async searchWorkflows(teamId: string, filter: WorkflowFilterDto): Promise<WorkflowMetadataEntity[]> {
    this.logger.log(`搜索工作流: teamId=${teamId}, filter=${JSON.stringify(filter)}`);

    // 如果直接指定了工作流 ID，直接查询
    if (filter.workflowIds && filter.workflowIds.length > 0) {
      return await this.searchByWorkflowIds(teamId, filter.workflowIds);
    }

    // 构建查询
    const queryBuilder = this.workflowRepository
      .createQueryBuilder('workflow')
      .where('workflow.teamId = :teamId', { teamId })
      .andWhere('workflow.isDeleted = :isDeleted', { isDeleted: false });

    // 按显示名称搜索（中英文模糊匹配）
    if (filter.displayNamePattern) {
      const pattern = `%${filter.displayNamePattern}%`;
      queryBuilder.andWhere(
        `(workflow.displayName->>'en' ILIKE :pattern OR workflow.displayName->>'zh' ILIKE :pattern)`,
        { pattern },
      );
      this.logger.debug(`添加名称过滤: ${filter.displayNamePattern}`);
    }

    // 按工具名搜索（需要解析 tasks JSON 数组）
    if (filter.toolName || filter.toolNamespace) {
      const toolFullName = filter.toolNamespace
        ? `${filter.toolNamespace}:${filter.toolName || ''}`
        : filter.toolName;

      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(workflow.tasks) AS task
          WHERE task->>'name' LIKE :toolPattern
        )`,
        { toolPattern: `%${toolFullName}%` },
      );
      this.logger.debug(`添加工具过滤: ${toolFullName}`);
    }

    // 按参数存在性搜索
    if (filter.hasParameter) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(workflow.tasks) AS task
          WHERE task->'inputParameters' ? :paramName
        )`,
        { paramName: filter.hasParameter },
      );
      this.logger.debug(`添加参数过滤: ${filter.hasParameter}`);
    }

    // 按分类搜索
    if (filter.category) {
      queryBuilder.andWhere(
        `workflow.categories @> :category::jsonb`,
        { category: JSON.stringify([filter.category]) },
      );
      this.logger.debug(`添加分类过滤: ${filter.category}`);
    }

    // 执行查询
    const workflows = await queryBuilder.getMany();
    this.logger.log(`找到 ${workflows.length} 个匹配的工作流`);

    return workflows;
  }

  /**
   * 根据工作流 ID 列表查询
   */
  private async searchByWorkflowIds(teamId: string, workflowIds: string[]): Promise<WorkflowMetadataEntity[]> {
    const workflows = await this.workflowRepository
      .createQueryBuilder('workflow')
      .where('workflow.teamId = :teamId', { teamId })
      .andWhere('workflow.workflowId IN (:...workflowIds)', { workflowIds })
      .andWhere('workflow.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    return workflows;
  }

  /**
   * 统计匹配的工作流数量（不加载完整数据）
   */
  async countWorkflows(teamId: string, filter: WorkflowFilterDto): Promise<number> {
    const workflows = await this.searchWorkflows(teamId, filter);
    return workflows.length;
  }

  /**
   * 检查工作流是否使用了指定的工具
   */
  checkWorkflowUsesTool(workflow: WorkflowMetadataEntity, toolName: string, toolNamespace?: string): boolean {
    const fullName = toolNamespace ? `${toolNamespace}:${toolName}` : toolName;

    if (!workflow.tasks || workflow.tasks.length === 0) {
      return false;
    }

    return workflow.tasks.some((task: any) => {
      return task.name && task.name.includes(fullName);
    });
  }

  /**
   * 检查工作流是否包含指定参数
   */
  checkWorkflowHasParameter(workflow: WorkflowMetadataEntity, parameterName: string): boolean {
    if (!workflow.tasks || workflow.tasks.length === 0) {
      return false;
    }

    return workflow.tasks.some((task: any) => {
      return task.inputParameters && task.inputParameters.hasOwnProperty(parameterName);
    });
  }
}
