import { WorkflowTriggerType } from '@/database/entities/workflow/workflow-trigger';
import { Injectable } from '@nestjs/common';
import { ChatCompletionMessageParam } from 'openai/resources';
import { WorkflowExecutionService } from './workflow.execution.service';

export interface RunOpenAICompatibleWorkflowParams {
  messages: Array<ChatCompletionMessageParam>;
  temperature?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

@Injectable()
export class WorkflowChatService {
  constructor(private readonly workflowExecutionService: WorkflowExecutionService) {}

  public async runOpenAICompatibleWorkflow(teamId: string, userId: string, workflowId: string, params: RunOpenAICompatibleWorkflowParams) {
    await this.workflowExecutionService.startWorkflow({
      teamId,
      userId,
      workflowId,
      inputData: params,
      triggerType: WorkflowTriggerType.API,
    });
  }
}
