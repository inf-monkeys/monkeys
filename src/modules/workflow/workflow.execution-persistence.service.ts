import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { logger } from '@/common/logger';
import { flattenObjectToString } from '@/common/utils';
import { WorkflowExecutionEntity } from '@/database/entities/workflow/workflow-execution';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Workflow } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { omit } from 'lodash';

@Injectable()
export class WorkflowExecutionPersistenceService {
  constructor(private readonly workflowRepository: WorkflowRepository) {}

  @OnEvent('workflow.completed.*')
  async handleWorkflowCompletion(payload: { workflowInstanceId: string; result: Workflow; timestamp: number }): Promise<void> {
    const { workflowInstanceId, result: conductorWorkflowExecution } = payload;
    logger.info(`Received workflow.completed event for instance: ${workflowInstanceId}. Persisting details.`);

    try {
      const detailedExecution = conductorWorkflowExecution;

      if (!detailedExecution) {
        logger.error(`Execution details missing in event payload for ${workflowInstanceId}. Cannot persist.`);
        return;
      }

      const inputForSearch = detailedExecution.input ? omit(detailedExecution.input, ['__context']) : null;
      const outputForSearch = detailedExecution.output || null;

      const searchableText = `${flattenObjectToString(inputForSearch)} ${flattenObjectToString(outputForSearch)}`.trim();

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
      };

      await this.workflowRepository.updateWorkflowExecutionDetailsByInstanceId(workflowInstanceId, updateData);
    } catch (error) {
      logger.error(`Error processing workflow completion for persistence of ${workflowInstanceId}:`, error);
    }
  }
}
