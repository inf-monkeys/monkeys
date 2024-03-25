import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { LockManager } from '@/common/utils/lock';
import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { WorkflowExecutionService } from '@/modules/workflow/workflow.execution.service';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WorkflowExecutionContext } from '../../../../common/dto/workflow-execution-context.dto';

@Injectable()
export class WorkflowCronService {
  private readonly lockResource = 'workflow-cron';

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowService: WorkflowExecutionService,
    @Inject('LOCK') private readonly lockManager: LockManager,
  ) {}

  private async scanAndExecute() {
    const currentTimestamp = +new Date();
    const triggersToRun = await this.workflowRepository.getTriggersToRun();
    const workflowIds = triggersToRun.map((x) => x.workflowId);
    const workflows = await this.workflowRepository.findWorkflowByIds(workflowIds);
    if (triggersToRun.length) {
      for (const trigger of triggersToRun) {
        const { workflowId, workflowVersion } = trigger;
        const workflow = workflows.find((w) => w.workflowId === workflowId && w.version === workflowVersion);
        const { creatorUserId: userId, teamId, variables = [] } = workflow;
        const workflowContext: WorkflowExecutionContext = {
          userId,
          teamId: teamId,
          appId: config.server.appId,
          appUrl: config.server.appUrl,
        };
        const inputData: { [x: string]: any } = {};
        variables?.forEach((v) => {
          if (v.default) {
            inputData[v.name] = v.default;
          }
        });

        const workflowInstanceId = await this.workflowService.startWorkflow({
          teamId,
          userId,
          workflowId,
          version: trigger.workflowVersion,
          inputData,
          workflowContext,
          triggerType: WorkflowTriggerType.SCHEDULER,
        });
        logger.log(`Run workflow by cron: workflowId=${workflowId}, inputData=${inputData}, workflowInstanceId=${workflowInstanceId}`);
      }

      await this.workflowRepository.updateNextTriggerTime(currentTimestamp, triggersToRun);
    }
  }

  @Cron('*/3 * * * * *')
  public async runScheduler() {
    const identifier = await this.lockManager.acquireLock(this.lockResource);
    if (identifier) {
      // 成功获取到锁，执行需要加锁的代码
      // this.logger.log(`开始获取锁: resource=${this.lockResource}`);
      try {
        await this.scanAndExecute();
      } catch (error) {
        logger.error('Run cron workflow failed:', error);
      } finally {
        // 释放锁
        await this.lockManager.releaseLock(this.lockResource, identifier);
      }
    } else {
    }
  }
}
