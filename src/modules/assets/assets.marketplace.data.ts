import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { TaskType } from '@inf-monkeys/conductor-javascript';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '../tools/llm/llm.controller';

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
        name: `${LLM_NAMESPACE}:${LLM_CHAT_COMPLETION_TOOL}`,
        taskReferenceName: 'llm:chat_completions_BtnrDqNN',
        type: TaskType.SIMPLE,
      },
    ],
    exposeOpenaiCompatibleInterface: true,
  },
  {
    tags: ['模型调用（AutoInfer）'],
    id: '662a1c620b9fd2739ab8d3a7',
    displayName: '大语言模型单轮对话',
    description: '基于大语言模型的单轮对话',
    iconUrl: 'emoji:🤖:#f2c1be',
    isPreset: true,
    isPublished: true,
    version: 1,
    variables: [
      {
        displayName: 'prompt',
        name: 'prompt',
        type: 'string',
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
        displayName: 'frequency_penalty',
        name: 'frequency_penalty',
        type: 'number',
        default: '0.5',
      },
    ],
    tasks: [
      {
        inputParameters: {
          frequency_penalty: '${workflow.input.frequency_penalty}',
          presence_penalty: '${workflow.input.presence_penalty}',
          prompt: '${workflow.input.prompt}',
          stream: '${workflow.input.stream}',
          temperature: '${workflow.input.temperature}',
        },
        name: `${LLM_NAMESPACE}:${LLM_COMPLETION_TOOL}`,
        taskReferenceName: 'llm:completions_KBDmHJNk',
        type: TaskType.SIMPLE,
      },
    ],
    exposeOpenaiCompatibleInterface: true,
  },
];
