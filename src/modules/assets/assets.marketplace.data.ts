import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { TaskType } from '@inf-monkeys/conductor-javascript';

export interface WorkflowMarketplaceData extends WorkflowMetadataEntity {
  tags: string[];
}

export const BUILT_IN_WORKFLOW_MARKETPLACE_LIST: Array<Partial<WorkflowMarketplaceData>> = [
  {
    tags: ['模型调用（AutoInfer）'],
    id: '662a1c620b9fd2739ab8d3a6',
    displayName: '大语言模型多轮对话',
    description: '基于大语言模型的多轮对话',
    iconUrl: 'emoji:🤖:#f2c1be',
    isPreset: true,
    isPublished: true,
    version: 1,
    variables: [
      {
        displayName: 'messages',
        name: 'messages',
        type: 'string',
        typeOptions: {
          multipleValues: true,
        },
      },
      {
        default: false,
        displayName: 'stream',
        name: 'stream',
        type: 'boolean',
      },
      {
        default: '0.7',
        displayName: 'temperature',
        name: 'temperature',
        type: 'number',
      },
      {
        default: '0.5',
        displayName: 'presence_penalty',
        name: 'presence_penalty',
        type: 'number',
      },
      {
        default: '0.5',
        displayName: 'frequency_penalty',
        name: 'frequency_penalty',
        type: 'number',
      },
    ],
    tasks: [
      {
        inputParameters: {
          frequency_penalty: '${workflow.input.frequency_penalty}',
          messages: '${workflow.input.messages}',
          presence_penalty: '${workflow.input.presence_penalty}',
          stream: '${workflow.input.stream}',
          temperature: '${workflow.input.temperature}',
        },
        name: 'llm:chat_completions',
        taskReferenceName: 'llm:chat_completions_BtnrDqNN',
        type: TaskType.SIMPLE,
      },
    ],
    exposeOpenaiCompatibleInterface: true,
  },
];
