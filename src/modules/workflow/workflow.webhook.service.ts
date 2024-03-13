import { config } from '@/common/config';
import { WorkflowExecutionContext } from '@/common/dto/workflow-execution-context.dto';
import { IRequest } from '@/common/typings/request';
import { WebhookTriggerResponseUntil, WorkflowTriggerAuthType, WorkflowTriggerMethod, WorkflowTriggerType } from '@/entities/workflow/workflow-trigger';
import { Injectable } from '@nestjs/common';
import { WorkflowRepository } from '../../repositories/workflow.repository';
import { WorkflowExecutionService } from './workflow.execution.service';

@Injectable()
export class WorkflowWebhookService {
  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  public async findWebhookTrigger(webhookPath: string) {
    return await this.workflowRepository.findWebhookTrigger(webhookPath);
  }

  public async triggerWorkflowByWebhook(webhookPath: string, req: IRequest, query: any, body: any) {
    const trigger = await this.findWebhookTrigger(webhookPath);

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

    const webhookConfig = trigger.webhookConfig!;
    const { method, auth, basicAuthConfig, headerAuthConfig, responseUntil } = webhookConfig;

    if (method.toUpperCase() !== req.method.toUpperCase()) {
      return [405, 'Method Not Allowed'];
    }

    if (auth === WorkflowTriggerAuthType.BASIC) {
      let authorization = req.headers['authorization'] as string;
      if (!authorization) {
        return [403, 'Please provide authorization header'];
      }
      authorization = authorization.replace('Basic ', '');
      const { username, password } = basicAuthConfig!;
      const expectedBasicToken = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
      if (authorization !== expectedBasicToken) {
        return [403, 'Invalid authorization header, please check username and password'];
      }
    }

    if (auth === WorkflowTriggerAuthType.CUSTOM_HEADER) {
      const { headerKey, headerValue } = headerAuthConfig!;
      const value = req.headers[headerKey] as string;
      if (!value) {
        return [403, `Please provide valid token in ${headerKey} header.`];
      }
      if (headerValue !== value) {
        return [403, `Invalid ${headerKey} value`];
      }
    }
    const { teamId, creatorUserId: userId } = workflow;
    // const userToken = await this.userService.generateUserToken(userId);
    const workflowContext: WorkflowExecutionContext = {
      userId,
      teamId: teamId,
      appId: config.server.appId,
      appUrl: config.server.appUrl,
    };

    let inputData = {};
    if (method === WorkflowTriggerMethod.POST) {
      inputData = body;
    } else {
      inputData = query;
    }

    const workflowInstanceId = await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData,
      workflowContext,
      triggerType: WorkflowTriggerType.WEBHOOK,
      version: workflowVersion,
    });

    if (responseUntil === WebhookTriggerResponseUntil.WORKFLOW_STARTED) {
      return [
        200,
        {
          workflowInstanceId,
        },
      ];
    } else {
      const result = await this.workflowExecutionService.waitForWorkflowResult(teamId, workflowInstanceId);
      return [200, result];
    }
  }
}
