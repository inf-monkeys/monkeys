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
];

export interface ComfyUIWorkflowWorkflowMarketplaceData extends ComfyuiWorkflowEntity {
  tags: string[];
}

export const BUILT_IN_COMFYUI_WORKFLOW_MARKETPLACE_LIST: Array<Partial<ComfyUIWorkflowWorkflowMarketplaceData>> = [
  {
    id: '664e1fa3103d67fd8406a5f3',
    tags: ['图像处理'],
    iconUrl: 'emoji:📷:#98ae36',
    displayName: '根据衣服生成模特穿衣图(ComfyUI_MagicClothing)',
    description: '基于 https://github.com/frankchieng/ComfyUI_MagicClothing 的 main workflow',
    workflowType: ComfyuiWorkflowSourceType.Json,
    originalData: {},
    workflow: {
      last_node_id: 23,
      last_link_id: 41,
      nodes: [
        {
          id: 16,
          type: 'PreviewImage',
          pos: [726, 784],
          size: {
            '0': 210,
            '1': 246,
          },
          flags: {},
          order: 3,
          mode: 0,
          inputs: [
            {
              name: 'images',
              type: 'IMAGE',
              link: 41,
              label: 'images',
              slot_index: 0,
            },
          ],
          properties: {
            'Node name for S&R': 'PreviewImage',
          },
        },
        {
          id: 8,
          type: 'PreviewImage',
          pos: [705, 274],
          size: {
            '0': 543.2338256835938,
            '1': 423.5530090332031,
          },
          flags: {},
          order: 2,
          mode: 0,
          inputs: [
            {
              name: 'images',
              type: 'IMAGE',
              link: 40,
              label: 'images',
              slot_index: 0,
            },
          ],
          properties: {
            'Node name for S&R': 'PreviewImage',
          },
        },
        {
          id: 9,
          type: 'LoadImage',
          pos: [-371, 322],
          size: {
            '0': 315,
            '1': 314,
          },
          flags: {},
          order: 0,
          mode: 0,
          outputs: [
            {
              name: 'IMAGE',
              type: 'IMAGE',
              links: [39],
              shape: 3,
              label: 'IMAGE',
              slot_index: 0,
            },
            {
              name: 'MASK',
              type: 'MASK',
              links: null,
              shape: 3,
              label: 'MASK',
            },
          ],
          properties: {
            'Node name for S&R': 'LoadImage',
          },
          widgets_values: ['valid_cloth_t1 (1).png', 'image'],
        },
        {
          id: 23,
          type: 'MagicClothing_Generate',
          pos: [132, 175],
          size: {
            '0': 418.1999816894531,
            '1': 430,
          },
          flags: {},
          order: 1,
          mode: 0,
          inputs: [
            {
              name: 'cloth_image',
              type: 'IMAGE',
              link: 39,
            },
            {
              name: 'face_image',
              type: 'IMAGE',
              link: null,
            },
            {
              name: 'pose_image',
              type: 'IMAGE',
              link: null,
            },
            {
              name: 'cloth_mask_image',
              type: 'IMAGE',
              link: null,
            },
          ],
          outputs: [
            {
              name: 'images',
              type: 'IMAGE',
              links: [40],
              shape: 3,
              slot_index: 0,
            },
            {
              name: 'cloth_mask_image',
              type: 'IMAGE',
              links: [41],
              shape: 3,
              slot_index: 1,
            },
          ],
          properties: {
            'Node name for S&R': 'MagicClothing_Generate',
          },
          widgets_values: [
            'a photography of a model',
            'OMS_1024_VTHD+DressCode_200000.safetensors',
            'SG161222/Realistic_Vision_V4.0_noVAE',
            true,
            1,
            'bare, monochrome, lowres, bad anatomy, worst quality, low quality',
            1999,
            'randomize',
            3,
            3,
            20,
            768,
            576,
            'FaceID',
          ],
        },
      ],
      links: [
        [39, 9, 0, 23, 0, 'IMAGE'],
        [40, 23, 0, 8, 0, 'IMAGE'],
        [41, 23, 1, 16, 0, 'IMAGE'],
      ],
      groups: [],
      config: {},
      extra: {
        ds: {
          scale: 0.7400249944258218,
          offset: {
            '0': 486.0008666350852,
            '1': 61.887842562004096,
          },
        },
      },
      version: 0.4,
    },
    prompt: {
      '8': {
        inputs: {
          images: ['23', 0],
        },
        class_type: 'PreviewImage',
        _meta: {
          title: 'Preview Image',
        },
      },
      '9': {
        inputs: {
          image: 'valid_cloth_t1.png',
          upload: 'image',
        },
        class_type: 'LoadImage',
        _meta: {
          title: 'Load Image',
        },
      },
      '16': {
        inputs: {
          images: ['23', 1],
        },
        class_type: 'PreviewImage',
        _meta: {
          title: 'Preview Image',
        },
      },
      '23': {
        inputs: {
          prompt: 'a photography of a model',
          model_path: 'OMS_1024_VTHD+DressCode_200000.safetensors',
          pipe_path: 'SG161222/Realistic_Vision_V4.0_noVAE',
          enable_cloth_guidance: true,
          num_samples: 1,
          n_prompt: 'bare, monochrome, lowres, bad anatomy, worst quality, low quality',
          seed: 1999,
          scale: 3,
          cloth_guidance_scale: 3,
          sample_steps: 20,
          height: 768,
          width: 576,
          faceid_version: 'FaceID',
          cloth_image: ['9', 0],
        },
        class_type: 'MagicClothing_Generate',
        _meta: {
          title: 'Human Garment Generation',
        },
      },
    },
    toolInput: [
      {
        displayName: `衣服图片`,
        name: `9_image`,
        type: 'file',
        default: '',
        required: true,
        typeOptions: {
          multipleValues: false,
          accept: '.jpg,.jpeg,.png,.webp',
          minValue: 1,
          maxValue: 1,
          maxSize: 1024 * 1024 * 10,
        },
      },
      {
        displayName: 'prompt',
        name: '23_prompt',
        type: 'string',
        default: 'a photography of a model',
        required: true,
      },
      {
        displayName: 'negative prompt',
        name: '23_n_prompt',
        type: 'string',
        default: 'bare, monochrome, lowres, bad anatomy, worst quality, low quality',
        required: true,
      },
    ],
    additionalModelList: [
      {
        name: 'magic_clothing_768_vitonhd_joint.safetensors',
        url: 'https://huggingface.co/ShineChen1024/MagicClothing/resolve/main/magic_clothing_768_vitonhd_joint.safetensors?download=true',
        dest: 'ComfyUI/custom_nodes/ComfyUI_MagicClothing/checkpoints',
      },
      {
        name: 'cloth_segm.pth',
        url: 'https://huggingface.co/ShineChen1024/MagicClothing/resolve/main/cloth_segm.pth?download=true',
        dest: 'ComfyUI/custom_nodes/ComfyUI_MagicClothing/checkpoints',
      },
      {
        name: 'OMS_1024_VTHD+DressCode_200000.safetensors',
        url: 'https://huggingface.co/ShineChen1024/MagicClothing/resolve/main/OMS_1024_VTHD%2BDressCode_200000.safetensors?download=true',
        dest: 'ComfyUI/custom_nodes/ComfyUI_MagicClothing/checkpoints',
      },
      {
        name: 'garment_extractor.safetensors',
        url: 'https://huggingface.co/ShineChen1024/MagicClothing/resolve/main/stable_ckpt/garment_extractor.safetensors?download=true',
        dest: 'ComfyUI/custom_nodes/ComfyUI_MagicClothing/checkpoints/stable_ckpt',
      },
      {
        name: 'ip_layer.pth',
        url: 'https://huggingface.co/ShineChen1024/MagicClothing/resolve/main/stable_ckpt/ip_layer.pth?download=true',
        dest: 'ComfyUI/custom_nodes/ComfyUI_MagicClothing/checkpoints/stable_ckpt',
      },
    ],
    additionalNodeList: [
      {
        url: 'https://static.infmonkeys.com/comfyui/custom_nodes/ComfyUI_MagicClothing.zip',
        name: 'ComfyUI_MagicClothing',
      },
    ],
  },
];
