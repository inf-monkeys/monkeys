import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { logger } from '@/common/logger';
import { flattenObjectToSearchableText } from '@/common/utils';
import { convertOutputFromRawOutput } from '@/common/utils/output';
import { WorkflowArtifactEntity } from '@/database/entities/workflow/workflow-artifact.entity';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Workflow } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { omit } from 'lodash';
import { Repository } from 'typeorm';

@Injectable()
export class WorkflowExecutionPersistenceService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,

    @InjectRepository(WorkflowArtifactEntity)
    private readonly workflowArtifactRepository: Repository<WorkflowArtifactEntity>,
  ) {}

  @OnEvent('workflow.completed.*')
  async handleWorkflowCompletion(payload: { workflowInstanceId: string; result: Workflow; timestamp: number }): Promise<void> {
    const { workflowInstanceId, result: conductorWorkflowExecution } = payload;
    logger.info(`[EVENT] workflow.completed.* received for ${workflowInstanceId}, output: ${JSON.stringify(conductorWorkflowExecution?.output)}`);

    try {
      const detailedExecution = conductorWorkflowExecution;

      if (!detailedExecution) {
        logger.error(`Execution details missing in event payload for ${workflowInstanceId}. Cannot persist.`);
        return;
      }

      const inputForSearch = detailedExecution.input ? omit(detailedExecution.input, ['__context', 'extraMetadata']) : null;
      const outputForSearch = detailedExecution.output || null;

      const finalOutput = convertOutputFromRawOutput(outputForSearch);

      const filteredOutput = finalOutput.filter((item) => (item.type === 'image' || item.type === 'video') && item.data);
      await Promise.all(
        filteredOutput.map(async (item, index) => {
          try {
            const workflowArtifact = new WorkflowArtifactEntity();
            workflowArtifact.id = `${workflowInstanceId}_${index}`;
            workflowArtifact.url = item.data;
            workflowArtifact.type = item.type;
            workflowArtifact.instanceId = workflowInstanceId;

            // 获取原始SQL
            const queryBuilder = this.workflowArtifactRepository.createQueryBuilder().insert().into(WorkflowArtifactEntity).values(workflowArtifact);

            const sql = queryBuilder.getQuery();
            logger.info(`保存工作流制品的SQL: ${sql}`);

            await this.workflowArtifactRepository.save(workflowArtifact);
          } catch (error) {
            logger.error(`Error persisting workflow artifact for ${workflowInstanceId}:`, error);
          }
        }),
      );

      const searchableText = `${flattenObjectToSearchableText(inputForSearch)} ${flattenObjectToSearchableText(outputForSearch)}`.trim();

      const updateData: Partial<WorkflowExecutionEntity> = {
        status: detailedExecution.status as WorkflowStatusEnum,
        takes: detailedExecution.endTime && detailedExecution.startTime ? detailedExecution.endTime - detailedExecution.startTime : null,
        input: detailedExecution.input || null,
        output: detailedExecution.output || null,
        tasks: detailedExecution.tasks || null,
        conductorCreateTime: detailedExecution.createTime,
        conductorStartTime: detailedExecution.startTime,
        conductorEndTime: detailedExecution.endTime,
        conductorUpdateTime: detailedExecution.updateTime,
        executedWorkflowDefinition: detailedExecution.workflowDefinition ? omit(detailedExecution.workflowDefinition, ['tasks', 'inputTemplate', 'outputParameters']) : null,
        executionVariables: detailedExecution.variables || null,
        updatedTimestamp: Date.now(),
        searchableText,
        extraMetadata: detailedExecution.input?.extraMetadata,
      };

      logger.debug(`[DB] updateWorkflowExecutionDetailsByInstanceId start for ${workflowInstanceId}`);
      await this.workflowRepository.updateWorkflowExecutionDetailsByInstanceId(workflowInstanceId, updateData);
      logger.debug(`[DB] updateWorkflowExecutionDetailsByInstanceId end for ${workflowInstanceId}`);
    } catch (error) {
      logger.error(`Error processing workflow completion for persistence of ${workflowInstanceId}:`, error);
    }
  }
}
