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
    displayName: {
      'zh-CN': '文本对话',
      'en-US': 'Chat Completions (LLM)',
    },
    description: {
      'zh-CN': '基于大语言模型的多轮对话',
      'en-US': 'Multi-turn dialogues based on LLMs',
    },
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
    displayName: {
      'zh-CN': '文本补全',
      'en-US': 'Completions (LLM)',
    },
    description: {
      'zh-CN': '基于大语言模型的文本补全，不具备上下文记忆能力。',
      'en-US': 'Single-turn dialogues based on LLMs',
    },
    iconUrl: 'emoji:🤖:#f2c1be',
    isPreset: false,
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
    displayName: {
      'zh-CN': '文本生成',
      'en-US': 'Text Generation (LLM)',
    },
    description: {
      'zh-CN': '通过大语言模型生成文本',
      'en-US': 'Generate text by LLMs',
    },
    iconUrl: 'emoji:🤖:#f2c1be',
    isPreset: false,
    isPublished: true,
    version: 1,
    variables: [
      {
        default: 'Hello',
        displayName: {
          'zh-CN': '用户消息',
          'en-US': 'User Message',
        },
        name: 'userMessage',
        type: 'string',
      },
      {
        default: 'You are a helpful assistant.',
        displayName: {
          'zh-CN': '系统预制 Prompt',
          'en-US': 'System Prompt',
        },
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
    displayName: {
      'zh-CN': '图像生成',
      'en-US': 'Text to Image (MJ)',
    },
    description: {
      'zh-CN': '根据用户输入的文本生成图像',
      'en-US': 'Generate images based on user input text',
    },
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
          systemPrompt: 'Generate a valid Midjourney prompt based on user input text, and do not include any other information.',
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
