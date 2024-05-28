import { ComfyuiWorkflowEntity, ComfyuiWorkflowSourceType } from '@/database/entities/comfyui/comfyui-workflow.entity';
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

export const BUILT_IN_COMFYUI_WORKFLOW_MARKETPLACE_LIST: Array<Partial<ComfyUIWorkflowWorkflowMarketplaceData>> = [
  {
    id: '664e1fa3103d67fd8406a5f3',
    tags: ['图像处理'],
    iconUrl: 'emoji:📷:#98ae36',
    displayName: '文本生成图像',
    description: '根据 prompt 和 negative prompt 文本生成图像，基于 https://comfyanonymous.github.io/ComfyUI_examples/2_pass_txt2img/ 官方示例。',
    workflowType: ComfyuiWorkflowSourceType.Json,
    originalData: {},
    prompt: {
      '3': {
        inputs: {
          seed: 89848141647836,
          steps: 12,
          cfg: 8,
          sampler_name: 'dpmpp_sde',
          scheduler: 'normal',
          denoise: 1,
          model: ['16', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
        class_type: 'KSampler',
        _meta: {
          title: 'KSampler',
        },
      },
      '5': {
        inputs: {
          width: 768,
          height: 768,
          batch_size: 1,
        },
        class_type: 'EmptyLatentImage',
        _meta: {
          title: 'Empty Latent Image',
        },
      },
      '6': {
        inputs: {
          text: 'masterpiece HDR victorian portrait painting of a silver knight, blonde hair, mountain nature, blue sky\n',
          clip: ['16', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '7': {
        inputs: {
          text: 'bad hands, text, watermark\n',
          clip: ['16', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '8': {
        inputs: {
          samples: ['3', 0],
          vae: ['16', 2],
        },
        class_type: 'VAEDecode',
        _meta: {
          title: 'VAE Decode',
        },
      },
      '9': {
        inputs: {
          filename_prefix: 'ComfyUI',
          images: ['8', 0],
        },
        class_type: 'SaveImage',
        _meta: {
          title: 'Save Image',
        },
      },
      '10': {
        inputs: {
          upscale_method: 'nearest-exact',
          width: 1152,
          height: 1152,
          crop: 'disabled',
          samples: ['3', 0],
        },
        class_type: 'LatentUpscale',
        _meta: {
          title: 'Upscale Latent',
        },
      },
      '11': {
        inputs: {
          seed: 469771404043268,
          steps: 14,
          cfg: 8,
          sampler_name: 'dpmpp_2m',
          scheduler: 'simple',
          denoise: 0.5,
          model: ['16', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['10', 0],
        },
        class_type: 'KSampler',
        _meta: {
          title: 'KSampler',
        },
      },
      '12': {
        inputs: {
          filename_prefix: 'Text2Image',
          images: ['13', 0],
        },
        class_type: 'SaveImage',
        _meta: {
          title: 'Save Image',
        },
      },
      '13': {
        inputs: {
          samples: ['11', 0],
          vae: ['16', 2],
        },
        class_type: 'VAEDecode',
        _meta: {
          title: 'VAE Decode',
        },
      },
      '16': {
        inputs: {
          ckpt_name: 'v2-1_768-ema-pruned.ckpt',
        },
        class_type: 'CheckpointLoaderSimple',
        _meta: {
          title: 'Load Checkpoint',
        },
      },
    },
    toolInput: [
      {
        displayName: 'prompt',
        name: 'prompt',
        type: 'string',
        default: 'masterpiece HDR victorian portrait painting of a silver knight, blonde hair, mountain nature, blue sky',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 6,
            key: 'text',
          },
        },
      },
      {
        displayName: 'negative prompt',
        name: 'negative_prompt',
        type: 'string',
        default: 'bad hands, text, watermark',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 7,
            key: 'text',
          },
        },
      },
    ],
  },
  {
    id: '664e1fa3103d67fd8406a5f4',
    tags: ['图像处理'],
    iconUrl: 'emoji:📷:#98ae36',
    displayName: '2Pass 文本生成图像',
    description: '文本生成图像（2Pass 模式），基于 https://comfyanonymous.github.io/ComfyUI_examples/2_pass_txt2img/ 官方示例。',
    workflowType: ComfyuiWorkflowSourceType.Json,
    originalData: {},
    prompt: {
      '4': {
        inputs: {
          ckpt_name: 'sd_xl_base_1.0.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
        _meta: {
          title: 'Load Checkpoint - BASE',
        },
      },
      '5': {
        inputs: {
          width: 1024,
          height: 1024,
          batch_size: 1,
        },
        class_type: 'EmptyLatentImage',
        _meta: {
          title: 'Empty Latent Image',
        },
      },
      '6': {
        inputs: {
          text: 'large beautiful black hole in the deep space',
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '7': {
        inputs: {
          text: 'text, watermark',
          clip: ['4', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '10': {
        inputs: {
          add_noise: 'enable',
          noise_seed: 721897303308196,
          steps: 25,
          cfg: 8,
          sampler_name: 'euler',
          scheduler: 'normal',
          start_at_step: 0,
          end_at_step: 20,
          return_with_leftover_noise: 'enable',
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0],
        },
        class_type: 'KSamplerAdvanced',
        _meta: {
          title: 'KSampler (Advanced) - BASE',
        },
      },
      '11': {
        inputs: {
          add_noise: 'disable',
          noise_seed: 0,
          steps: 25,
          cfg: 8,
          sampler_name: 'euler',
          scheduler: 'normal',
          start_at_step: 20,
          end_at_step: 10000,
          return_with_leftover_noise: 'disable',
          model: ['12', 0],
          positive: ['15', 0],
          negative: ['16', 0],
          latent_image: ['10', 0],
        },
        class_type: 'KSamplerAdvanced',
        _meta: {
          title: 'KSampler (Advanced) - REFINER',
        },
      },
      '12': {
        inputs: {
          ckpt_name: 'sd_xl_refiner_1.0.safetensors',
        },
        class_type: 'CheckpointLoaderSimple',
        _meta: {
          title: 'Load Checkpoint - REFINER',
        },
      },
      '15': {
        inputs: {
          text: 'evening sunset scenery blue sky nature, glass bottle with a galaxy in it',
          clip: ['12', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '16': {
        inputs: {
          text: 'text, watermark',
          clip: ['12', 1],
        },
        class_type: 'CLIPTextEncode',
        _meta: {
          title: 'CLIP Text Encode (Prompt)',
        },
      },
      '17': {
        inputs: {
          samples: ['11', 0],
          vae: ['12', 2],
        },
        class_type: 'VAEDecode',
        _meta: {
          title: 'VAE Decode',
        },
      },
      '19': {
        inputs: {
          filename_prefix: 'ComfyUI',
          images: ['17', 0],
        },
        class_type: 'SaveImage',
        _meta: {
          title: 'Save Image',
        },
      },
    },
    toolInput: [
      {
        displayName: 'Base Prompt',
        name: 'base_prompt',
        type: 'string',
        default: 'large beautiful black hole in the deep space',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 6,
            key: 'text',
          },
        },
      },
      {
        displayName: 'Base Negative Prompt',
        name: 'base_negative_prompt',
        type: 'string',
        default: 'text, watermark',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 7,
            key: 'text',
          },
        },
      },
      {
        displayName: 'REFINER Prompt',
        name: 'refiner_base_prompt',
        type: 'string',
        default: 'evening sunset scenery blue sky nature, glass bottle with a galaxy in it',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 15,
            key: 'text',
          },
        },
      },
      {
        displayName: 'REFINER Negative Prompt',
        name: 'refiner_negative_prompt',
        type: 'string',
        default: 'text, watermark',
        required: true,
        typeOptions: {
          comfyOptions: {
            node: 16,
            key: 'text',
          },
        },
      },
    ],
  },
];
