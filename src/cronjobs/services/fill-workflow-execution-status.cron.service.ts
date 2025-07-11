import { LOCK_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { logger } from '@/common/logger';
import { flattenObjectToString } from '@/common/utils';
import { LockManager } from '@/common/utils/lock';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { omit } from 'lodash';

@Injectable()
export class FillWorkflowExecutionStatusCronService {
  private readonly lockResource = `${config.server.appId}:cron:lock:fill-workflow-execution-status`;

  constructor(
    @Inject(LOCK_TOKEN) private readonly lockManager: LockManager,
    private readonly workflowRepository: WorkflowRepository,
  ) {}

  @Cron('*/1 * * * * *')
  public async runScheduler() {
    if (!config.cron.enabled) {
      return;
    }
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      try {
        // 一次查多条
        const executions = await this.workflowRepository.fetchWorkflowExecutionsWithNoStatus(10);
        if (executions && executions.length > 0) {
          for (const execution of executions) {
            logger.info(`[CRON] Found execution with no status: ${execution.workflowInstanceId}`);
            try {
              const data = await conductorClient.workflowResource.getExecutionStatus(execution.workflowInstanceId, true, true);
              const takes = data.endTime ? data.endTime - data.startTime : 0;

              // 构建完整的更新数据，包括 input、output 等字段
              const inputForSearch = data.input ? omit(data.input, ['__context', 'extraMetadata']) : null;
              const outputForSearch = data.output || null;
              const searchableText = `${flattenObjectToString(inputForSearch)} ${flattenObjectToString(outputForSearch)}`.trim();

              const updateData = {
                status: data.status as WorkflowStatusEnum,
                takes,
                input: data.input || null,
                output: data.output || null,
                tasks: data.tasks || null,
                conductorCreateTime: data.createTime,
                conductorStartTime: data.startTime,
                conductorEndTime: data.endTime,
                conductorUpdateTime: data.updateTime,
                executedWorkflowDefinition: data.workflowDefinition ? omit(data.workflowDefinition, ['tasks', 'inputTemplate', 'outputParameters']) : null,
                executionVariables: data.variables || null,
                updatedTimestamp: Date.now(),
                searchableText,
                extraMetadata: data.input?.extraMetadata,
              };

              await this.workflowRepository.updateWorkflowExecutionDetailsByInstanceId(execution.workflowInstanceId, updateData);
              logger.info(`[CRON] Successfully updated execution ${execution.workflowInstanceId} with status: ${data.status}`);
            } catch (error) {
              logger.error(`[CRON] Error updating execution ${execution.workflowInstanceId}:`, error);
              // 标记为 UNKNOWN，避免一直卡死
              await this.workflowRepository.updateWorkflowExecutionStatus(execution.workflowInstanceId, WorkflowStatusEnum.UNKNOWN, 0);
            }
          }
        }
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
      // logger.log('获取不到锁');
    }
  }
}
