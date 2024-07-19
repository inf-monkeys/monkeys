import { LOCK_TOKEN } from '@/common/common.module';
import { conductorClient } from '@/common/conductor';
import { config } from '@/common/config';
import { WorkflowStatusEnum } from '@/common/dto/status.enum';
import { LockManager } from '@/common/utils/lock';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

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
        const execution = await this.workflowRepository.fetchWorkflowExecutionWithNoStatus();
        if (execution) {
          try {
            const data = await conductorClient.workflowResource.getExecutionStatus(execution.workflowInstanceId, false, false);
            const takes = data.endTime ? data.endTime - data.startTime : 0;
            await this.workflowRepository.updateWorkflowExecutionStatus(execution.workflowInstanceId, data.status as WorkflowStatusEnum, takes);
          } catch (error) {
            await this.workflowRepository.updateWorkflowExecutionStatus(execution.workflowInstanceId, WorkflowStatusEnum.UNKNOWN, 0);
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
