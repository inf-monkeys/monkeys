import { WorkflowArtifactEntity } from '@/database/entities/workflow/workflow-artifact.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WorkflowExecutionService } from './workflow.execution.service';

@Injectable()
export class WorkflowArtifactService {
  constructor(
    @InjectRepository(WorkflowArtifactEntity)
    private readonly workflowArtifactRepository: Repository<WorkflowArtifactEntity>,
    private readonly workflowExecutionService: WorkflowExecutionService,
    private dataSource: DataSource,
  ) {}

  async getWorkflowArtifacts(instanceId: string, teamId: string) {
    // 使用事务进行查询
    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      // 首先验证 execution 是否属于该 team
      const execution = await transactionalEntityManager
        .createQueryBuilder(WorkflowExecutionEntity, 'execution')
        .where('execution.workflowInstanceId = :instanceId', { instanceId })
        .andWhere('execution.group = :teamId', { teamId })
        .getOne();

      if (!execution) {
        throw new ForbiddenException('No permission to access this workflow execution');
      }

      // 查询相关的 artifacts
      const artifacts = await transactionalEntityManager.createQueryBuilder(WorkflowArtifactEntity, 'artifact').where('artifact.instanceId = :instanceId', { instanceId }).getMany();

      return artifacts;
    });
  }

  async getWorkflowInstanceByArtfactUrl(url: string, teamId: string) {
    const artifact = await this.workflowArtifactRepository.findOne({ where: { url } });

    if (!artifact) {
      throw new NotFoundException('产物不存在');
    }

    const execution = await this.workflowExecutionService.getWorkflowExecutionSimpleDetail(teamId, artifact.instanceId);

    if (!execution) {
      throw new NotFoundException('工作流实例不存在或无权限访问');
    }

    return execution;
  }
}
