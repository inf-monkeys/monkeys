import { Workflow } from '@inf-monkeys/conductor-javascript';
import { Injectable } from '@nestjs/common';
import Langfuse from 'langfuse';
import { ObservabilityRepository } from '../../database/repositories/observability.repository';
import { ObservabilityPlatform, ObservabilityPlatformConfig } from './interfaces/observability';

export type WorkflowObservabilityFactory = (rawWorkflowExecution: Workflow) => Promise<void>;

@Injectable()
export class WorkflowObservabilityService {
  constructor(private readonly observabilityRepository: ObservabilityRepository) { }

  public async getWorkflowObservabilityDataList(teamId: string, workflowId: string) {
    const workflowObservability = await this.observabilityRepository.getWorkflowObservability(teamId, workflowId);
    return workflowObservability;
  }

  public async createWorkflowObservability(teamId: string, workflowId: string, platform: ObservabilityPlatform, platformConfig: ObservabilityPlatformConfig, name?: string) {
    const workflowObservability = await this.observabilityRepository.createWorkflowObservability(teamId, workflowId, platform, platformConfig, name);
    return workflowObservability;
  }

  convertWorkflowExecutionToLangfuseFactory(langfuse: Langfuse) {
    return async (rawWorkflowExecution: Workflow) => {
      const workflowId = rawWorkflowExecution.workflowDefinition.name;
      const workflowInstanceId = rawWorkflowExecution.workflowId;
      const tasks = rawWorkflowExecution.tasks;

      const trace = langfuse.trace({
        name: workflowId,
        id: workflowInstanceId,
        userId: rawWorkflowExecution.input.__context.userId,
        input: rawWorkflowExecution.input,
        output: rawWorkflowExecution.output,
        metadata: rawWorkflowExecution,

      });

      for (const task of tasks) {
        const event = trace.event({
          id: task.referenceTaskName,
          name: task.referenceTaskName,
          metadata: task,
          input: task.inputData,
          output: task.outputData,
          startTime: new Date(task.startTime),
        });

        switch (task.taskType) {
          case 'llm:generate_text':
            event.generation({
              name: task.referenceTaskName,
              model: task.inputData.model,
              modelParameters: {
                temperature: task.inputData.temperature,
                frequencyPenalty: task.inputData.frequency_penalty,
                presencePenalty: task.inputData.presence_penalty,
              },
              usage: task.outputData.usage,
              prompt: task.inputData.userMessage,
              input: task.inputData.userMessage,
              output: task.outputData.message,
              metadata: task,
              startTime: new Date(task.startTime),
              endTime: new Date(task.endTime),
            });
            break;
          default:
            event.span({
              name: task.referenceTaskName,
              input: task.inputData,
              output: task.outputData,
              metadata: task,
              startTime: new Date(task.startTime),
              endTime: new Date(task.endTime),
            });
            break;
        }
      }

      await langfuse.shutdownAsync();
    };
  }

  public async getWorkflowObservabilityInstanceList(teamId: string, workflowId: string): Promise<WorkflowObservabilityFactory[]> {
    const dataList = await this.getWorkflowObservabilityDataList(teamId, workflowId);

    const instanceList: WorkflowObservabilityFactory[] = dataList
      .map((item) => {
        switch (item.platform) {
          case ObservabilityPlatform.LANGFUSE:
            const langfuse = new Langfuse({
              secretKey: item.platformConfig.secretKey,
              publicKey: item.platformConfig.publicKey,
              baseUrl: item.platformConfig.baseUrl ?? 'https://cloud.langfuse.com',
            });
            return this.convertWorkflowExecutionToLangfuseFactory(langfuse);
          default:
            return null;
        }
      })
      .filter(Boolean);
    return instanceList;
  }
}
