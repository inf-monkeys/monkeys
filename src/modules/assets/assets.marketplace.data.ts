import { ComfyuiWorkflowEntity } from '@/database/entities/comfyui/comfyui-workflow.entity';
import { WorkflowMetadataEntity } from '@/database/entities/workflow/workflow-metadata';
import { PageInstanceType } from '@/database/entities/workflow/workflow-page';
import { TaskType } from '@inf-monkeys/conductor-javascript';
import { LLM_CHAT_COMPLETION_TOOL, LLM_COMPLETION_TOOL, LLM_NAMESPACE } from '../tools/llm/llm.controller';

export interface WorkflowMarketplaceData extends WorkflowMetadataEntity {
  tags: string[];
  autoPinPage?: PageInstanceType[];
}

export const BUILT_IN_WORKFLOW_MARKETPLACE_LIST: Array<Partial<WorkflowMarketplaceData>> = [
  {
    tags: ['模型调用（AutoInfer）'],
    autoPinPage: ['chat'],
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
      {
        default: false,
        displayName: 'show_logs',
        name: 'show_logs',
        type: 'boolean',
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
          show_logs: '${workflow.input.show_logs}',
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
    autoPinPage: ['chat'],
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
  {
    tags: ['模型调用（AutoInfer）'],
    autoPinPage: ['chat'],
    id: '664f1e0db10cb3ffc558437a',
    displayName: '文本生成（大语言模型）',
    description: '通过大语言模型生成文本',
    iconUrl: 'emoji:🤖:#f2c1be',
    isPreset: true,
    isPublished: true,
    version: 1,
    variables: [
      {
        default: 'Hello',
        displayName: '用户消息',
        name: 'userMessage',
        type: 'string',
      },
      {
        default: 'You are a helpful assistant.',
        displayName: '系统预置 Prompt',
        name: 'systemPrompt',
        type: 'string',
      },
    ],
    tasks: [
      {
        inputParameters: {
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
          response_format: 'text',
          systemPrompt: '${workflow.input.systemPrompt}',
          temperature: 0.7,
          userMessage: '${workflow.input.userMessage}',
        },
        name: 'llm:generate_text',
        taskReferenceName: 'llm:generate_text_wPMrkKKb',
        type: TaskType.SIMPLE,
      },
    ],
  },
  {
    tags: ['图像生成'],
    autoPinPage: ['preview'],
    id: '665569753c72460540612445',
    displayName: '文本生成图像（MJ）',
    description: '使用大语言模型构建 Prompt，再用 MJ 生成图片。',
    iconUrl: 'emoji:📷:#98ae36',
    isPreset: true,
    isPublished: true,
    version: 1,
    variables: [
      {
        displayName: 'topic',
        name: 'topic',
        type: 'string',
        default: 'a cat',
      },
    ],
    tasks: [
      {
        inputParameters: {
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
          response_format: 'text',
          systemPrompt: '根据用户的需求生成 Midjourney 的 prompt，除此之外不要返回任何其他内容。是有用户的语言作为回答的语言。',
          temperature: 0.7,
          userMessage: '${workflow.input.topic}',
        },
        name: 'llm:generate_text',
        taskReferenceName: 'llm:generate_text_RtWLpB96',
        type: TaskType.SIMPLE,
      },
      {
        inputParameters: {
          aspect_ratio: '1:1',
          process_mode: 'relax',
          prompt: '${llm:generate_text_RtWLpB96.output.message}',
          skip_prompt_check: false,
        },
        name: 'midjourney:goapi_midjourney',
        taskReferenceName: 'midjourney:goapi_midjourney_P8PPWFBN',
        type: TaskType.SIMPLE,
      },
    ],
  },
];

export interface ComfyUIWorkflowWorkflowMarketplaceData extends ComfyuiWorkflowEntity {
  tags: string[];
}
