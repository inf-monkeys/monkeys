import { config } from '@/common/config';
import { WorkflowRepository } from '@/database/repositories/workflow.repository';
import { Injectable } from '@nestjs/common';
import { WorkflowExecutionService } from './workflow.execution.service';

@Injectable()
export class WorkflowCustomTriggerInvokeService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  public getCustomTriggerEndpoint(triggerId: string) {
    return `${config.server.appUrl}/api/internal/triggers/${triggerId}/invoke`;
  }

  public async triggerWorkflow(triggerId: string, data: { [x: string]: any }): Promise<[number, any]> {
    const { sync, ...rest } = data;
    const trigger = await this.workflowRepository.getWorkflowTrigger(triggerId);
    if (!trigger || trigger.isDeleted) {
      return [404, 'Trigger Not Found'];
    }
    if (!trigger.enabled) {
      return [404, 'Trigger Not Enabled'];
    }
    const { workflowId, workflowVersion } = trigger;
    const workflow = await this.workflowRepository.getWorkflowById(workflowId, workflowVersion);
    if (!workflow) {
      return [404, 'Workflow not exists'];
    }
    const { teamId, creatorUserId: userId } = workflow;
    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: rest,
      triggerType: trigger.type,
      version: workflowVersion,
    });
    if (sync) {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      return [200, result];
    } else {
      return [
        200,
        {
          workflowInstanceId,
        },
      ];
    }
  }
}
