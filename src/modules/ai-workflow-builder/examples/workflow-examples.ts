/**
 * 真实工作流示例库
 * 用于Few-shot学习，教AI生成正确的工作流结构
 */

export interface WorkflowExample {
  scenario: string;
  userDescription: string;
  workflowJson: any;
  keyFeatures: string[];
}

/**
 * 示例1：多模型文生图工作流（SWITCH节点 + 条件显示）
 */
const MULTI_MODEL_TEXT_TO_IMAGE_EXAMPLE: WorkflowExample = {
  scenario: '多模型文生图',
  userDescription: '生成文生图工作流，支持Gemini/GPT/Jimeng三个模型选择，宽高比可选，分辨率可选',
  keyFeatures: [
    'SWITCH节点实现模型选择',
    'visibility条件控制参数显示',
    '多个decisionCases分支',
    'evaluatorType使用value-param',
  ],
  workflowJson: {
    displayName: {
      'zh-CN': '文生图',
      'en-US': 'Text to Image',
    },
    description: '',
    iconUrl: 'lucide:type',
    variables: [
      {
        name: 'prompt',
        displayName: {
          'zh-CN': '提示词',
          'en-US': 'Prompts',
        },
        type: 'string',
        required: true,
        typeOptions: {
          placeholder: {
            'zh-CN': '请填充如 "A red dress with floral patterns"',
            'en-US': 'Please enter some prompts like A red dress with floral patterns',
          },
        },
      },
      {
        name: '__parallelTaskCount',
        displayName: {
          'zh-CN': '生成图片数量',
          'en-US': 'The Number Of Generated Images',
        },
        type: 'number',
        required: false,
        default: 1,
        typeOptions: {
          minValue: 1,
          maxValue: 8,
          numberPrecision: 1,
        },
      },
      {
        name: 'aspect_ratio',
        displayName: {
          'zh-CN': '宽高比',
          'en-US': 'Aspect Ratio',
        },
        type: 'string',
        required: true,
        default: '3:4',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            { label: { 'zh-CN': '1:1 (1024x1024)' }, value: '1:1' },
            { label: { 'zh-CN': '2:3 (832x1248)' }, value: '2:3' },
            { label: { 'zh-CN': '3:2 (1248x832)' }, value: '3:2' },
            { label: { 'zh-CN': '3:4 (864x1184)' }, value: '3:4' },
            { label: { 'zh-CN': '4:3 (1184x864)' }, value: '4:3' },
            { label: { 'zh-CN': '9:16 (768x1344)' }, value: '9:16' },
            { label: { 'zh-CN': '16:9 (1344x768)' }, value: '16:9' },
          ],
        },
      },
      {
        name: 'dkhgcz',
        displayName: {
          'zh-CN': '图像分辨率',
          'en-US': 'Image Resolution',
        },
        type: 'string',
        required: false,
        default: '2K',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            { label: { 'zh-CN': '1K' }, value: '1K' },
            { label: { 'zh-CN': '2K' }, value: '2K' },
            { label: { 'zh-CN': '4K' }, value: '4K' },
          ],
          // ⚠️ 关键特性：条件显示
          visibility: {
            conditions: [
              {
                field: 'workflow_type',
                operator: 'notIn',
                value: ['Nano Banana Pro'],
              },
            ],
            logic: 'AND',
          },
        },
      },
      {
        name: 'workflow_type',
        displayName: {
          'zh-CN': '模型选择',
          'en-US': 'Model Select',
        },
        type: 'string',
        required: true,
        default: 'Nano Banana Pro',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            {
              label: { 'zh-CN': 'Nano Banana', 'en-US': 'Nano Banana' },
              value: 'gemini-2.5-flash-image(nano banana)',
            },
            {
              label: { 'zh-CN': 'GPT-Image-1', 'en-US': 'GPT-Image-1' },
              value: 'gpt-image-1',
            },
            {
              label: { 'zh-CN': 'Nano Banana Pro' },
              value: 'Nano Banana Pro',
            },
          ],
        },
      },
    ],
    tasks: [
      {
        __alias: {
          title: '工作流类别选择',
        },
        name: 'switch',
        taskReferenceName: 'switch_GBHJrBcm',
        type: 'SWITCH',
        // ⚠️ 关键特性：SWITCH节点配置
        evaluatorType: 'value-param',
        expression: 'workflow_type',
        inputParameters: {
          __advancedConfig: {
            timeout: 3600,
          },
          parameters: {},
          workflow_type: '${workflow.input.workflow_type}',
        },
        // ⚠️ 关键特性：decisionCases定义多个分支
        decisionCases: {
          'Nano Banana Pro': [
            {
              name: 'third_party_api:gemini_3_pro_image_generate',
              taskReferenceName: 'third_party_api:gemini_3_pro_image_generate_hfgnhw7f',
              type: 'SIMPLE',
              inputParameters: {
                __advancedConfig: {
                  timeout: 3600,
                },
                baseUrl: 'https://generativelanguage.googleapis.com',
                input: {
                  aspect_ratio: '${workflow.input.aspect_ratio}',
                  image_size: '${workflow.input.dkhgcz}',
                  prompt: '${workflow.input.prompt}',
                },
              },
            },
          ],
          'gemini-2.5-flash-image(nano banana)': [
            {
              __alias: {
                title: 'gemini-2.5-flash-image(nano banana)',
              },
              name: 'third_party_api:gemini_2_5_flash_image_generate',
              taskReferenceName: 'third_party_api:gemini_2_5_flash_image_generate_7GM66CQB',
              type: 'SIMPLE',
              inputParameters: {
                __advancedConfig: {
                  timeout: 3600,
                },
                baseUrl: 'https://generativelanguage.googleapis.com',
                input: {
                  aspect_ratio: '${workflow.input.aspect_ratio}',
                  input_image: '',
                  prompt: '${workflow.input.prompt}',
                },
              },
            },
          ],
          'gpt-image-1': [
            {
              __alias: {
                title: 'gpt-image-1',
              },
              name: 'third_party_api:openai_gpt4_vision',
              taskReferenceName: 'third_party_api:openai_gpt4_vision_7FJjpCtf',
              type: 'SIMPLE',
              inputParameters: {
                __advancedConfig: {
                  timeout: 3600,
                },
                credential: {
                  id: '6902ce60971a1b9c402fb9ba',
                  type: 'third_party_api:openai',
                },
                input: {
                  input_image: '',
                  max_tokens: 1000,
                  model: 'gpt-image-1',
                  prompt: '${workflow.input.prompt}',
                  quality: 'standard',
                  size: 'auto',
                  temperature: 0.7,
                },
              },
            },
          ],
        },
      },
    ],
    output: null,
  },
};

/**
 * 示例2：图生图工作流（文件上传类型）
 */
const IMAGE_TO_IMAGE_EXAMPLE: WorkflowExample = {
  scenario: '图生图',
  userDescription: '生成图生图工作流，用户上传图片，输入AI功能描述，选择模型',
  keyFeatures: [
    'type: "file" 实现文件上传',
    'SWITCH节点支持模型选择',
    'input_image参数引用上传的文件',
  ],
  workflowJson: {
    displayName: 'Image to Image',
    description: '',
    iconUrl: 'custom-icon:https://inf-monkeys.oss-cn-beijing.aliyuncs.com/icons/lf/workflow/ai-image.svg',
    variables: [
      {
        name: 'ftnqqd',
        displayName: {
          'zh-CN': '图片上传',
          'en-US': 'Image Upload',
        },
        // ⚠️ 关键特性：文件上传类型
        type: 'file',
        required: true,
        typeOptions: {
          assetType: '',
          enableReset: false,
          foldUp: false,
          multipleValues: false,
          placeholder: '',
          selectList: [],
          singleColumn: false,
          textareaMiniHeight: 40,
          tips: '',
        },
      },
      {
        name: 'bmgjb9',
        displayName: {
          'zh-CN': 'AI 功能',
          'en-US': 'Prompts',
        },
        type: 'string',
        required: true,
        default: 'Casual jeans and a white t-shirt.',
        description: {
          'zh-CN': '请描述您对这些图像的创意...',
          'en-US': 'Please describe your creative ideas for the images...',
        },
        typeOptions: {
          placeholder: '',
          textareaMiniHeight: 120,
        },
      },
      {
        name: '__parallelTaskCount',
        displayName: {
          'zh-CN': '生成图片数量',
          'en-US': 'The Number Of Generated Images',
        },
        type: 'number',
        required: false,
        default: 1,
        typeOptions: {
          minValue: 1,
          maxValue: 8,
        },
      },
      {
        name: 'workflow_type',
        displayName: {
          'zh-CN': '模型选择',
          'en-US': 'Model Select',
        },
        type: 'string',
        required: true,
        default: 'Nano Banana Pro',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            { label: { 'zh-CN': 'Nano Banana' }, value: 'gemini-2.5-flash-image(nano banana)' },
            { label: { 'zh-CN': 'GPT-Image-1' }, value: 'gpt-image-1' },
            { label: { 'zh-CN': 'Nano Banana Pro' }, value: 'Nano Banana Pro' },
          ],
        },
      },
    ],
    tasks: [
      {
        __alias: {
          title: '工作流类别选择',
        },
        name: 'switch',
        taskReferenceName: 'switch_FPrPPH9J',
        type: 'SWITCH',
        evaluatorType: 'value-param',
        expression: 'workflow_type',
        inputParameters: {
          parameters: {},
          workflow_type: '${workflow.input.workflow_type}',
        },
        decisionCases: {
          'Nano Banana Pro': [
            {
              name: 'third_party_api:gemini_3_pro_image_generate',
              taskReferenceName: 'third_party_api:gemini_3_pro_image_generate_hLtTWK7G',
              type: 'SIMPLE',
              inputParameters: {
                input: {
                  aspect_ratio: '${workflow.input.aspect_ratio}',
                  image_size: '${workflow.input.m8bppd}',
                  // ⚠️ 关键特性：引用文件上传变量
                  input_image: '${workflow.input.ftnqqd}',
                  prompt: '${workflow.input.bmgjb9}',
                },
              },
            },
          ],
        },
      },
    ],
    output: null,
  },
};

/**
 * 示例3：Fal AI图片放大工作流（复杂参数 + 文件上传）
 */
const FAL_AI_UPSCALE_EXAMPLE: WorkflowExample = {
  scenario: 'Fal AI图片放大',
  userDescription: '使用Fal AI放大图片，支持增强模型选择、放大倍数、主体检测、面部优化等参数',
  keyFeatures: [
    '文件上传',
    '多个下拉选择参数',
    '数字参数带范围限制',
    '单个SIMPLE task（非SWITCH）',
  ],
  workflowJson: {
    displayName: 'Image Upscale',
    description: '',
    iconUrl: 'custom-icon:https://inf-monkeys.oss-cn-beijing.aliyuncs.com/icons/lf/workflow/ai-image.svg',
    variables: [
      {
        name: 'zdbzgw',
        displayName: {
          'zh-CN': '图片上传',
          'en-US': 'Image Upload',
        },
        type: 'file',
        required: true,
        typeOptions: {},
      },
      {
        name: 'zfbcmf',
        displayName: {
          'zh-CN': '增强模型',
          'en-US': 'Enhance Model',
        },
        type: 'string',
        required: true,
        default: 'Standard V2',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            { label: { 'en-US': 'Standard V2' }, value: 'Standard V2' },
            { label: { 'en-US': 'Low Resolution V2' }, value: 'Low Resolution V2' },
            { label: { 'en-US': 'CGI' }, value: 'CGI' },
            { label: { 'en-US': 'High Fidelity V2' }, value: 'High Fidelity V2' },
            { label: { 'en-US': 'Text Refine' }, value: 'Text Refine' },
          ],
        },
      },
      {
        name: '6wb989',
        displayName: {
          'zh-CN': '放大倍数',
          'en-US': 'Upscale Factor',
        },
        type: 'number',
        required: false,
        default: '2',
        typeOptions: {
          enableSelectList: true,
          selectListDisplayMode: 'dropdown',
          selectList: [
            { label: { 'en-US': '2' }, value: '2' },
            { label: { 'en-US': '4' }, value: '4' },
            { label: { 'en-US': '6' }, value: '6' },
          ],
        },
      },
      {
        name: 'fctjg9',
        displayName: {
          'zh-CN': '面部增强创意度',
          'en-US': 'Face Enhancement Creativity',
        },
        type: 'number',
        required: false,
        default: 0.7,
        typeOptions: {
          minValue: 0,
          maxValue: 1,
          numberPrecision: 0.1,
        },
      },
    ],
    tasks: [
      {
        name: 'third_party_api:fal_ai_endpoint_subscribe',
        taskReferenceName: 'third_party_api:fal_ai_endpoint_subscribe_KfzfdP7n',
        type: 'SIMPLE',
        inputParameters: {
          __advancedConfig: {
            timeout: 3600,
          },
          credential: {
            id: '6902d5e3b7b43ffedbf53772',
            type: 'third_party_api:fal-ai',
          },
          endpoint: 'fal-ai/topaz/upscale/image',
          input: {
            enhance_model: '${workflow.input.zfbcmf}',
            face_enhancement: '${workflow.input.7rmdpc}',
            face_enhancement_creativity: '${workflow.input.c8mpjb}',
            face_enhancement_strength: '${workflow.input.fctjg9}',
            image_url: '${workflow.input.zdbzgw}',
            subject_detection: '${workflow.input.m9tm69}',
            upscale_factor: '${workflow.input.6wb989}',
          },
        },
      },
    ],
    output: null,
  },
};

/**
 * 示例4：Tripo 3D模型生成 + 自定义代码节点
 */
const TRIPO_3D_WITH_CODE_EXAMPLE: WorkflowExample = {
  scenario: 'Tripo 3D模型生成 + 代码处理',
  userDescription: '使用Tripo生成3D模型，然后用自定义代码提取URL',
  keyFeatures: [
    '顺序执行多个tasks',
    'sandbox:sandbox自定义代码节点',
    'JavaScript代码处理输出',
  ],
  workflowJson: {
    displayName: {
      'zh-CN': 'Tripo 3D 文生模型',
    },
    description: '文生模型',
    iconUrl: 'emoji:🍀:#eeeef1',
    variables: [
      {
        name: 'prompt',
        displayName: {
          'zh-CN': '提示词',
        },
        type: 'string',
        required: false,
        typeOptions: {},
      },
    ],
    tasks: [
      {
        name: 'third_party_api:tripo_3d_generate',
        taskReferenceName: 'third_party_api:tripo_3d_generate_JQBCCDKQ',
        type: 'SIMPLE',
        inputParameters: {
          __advancedConfig: {
            timeout: 3600,
          },
          credential: {
            id: '6848e7faa6884eae44d65da4',
            type: 'third_party_api:tripo-api',
          },
          input: {
            prompt: '${workflow.input.prompt}',
          },
          type: 'text_to_model',
        },
      },
      // ⚠️ 关键特性：自定义代码节点
      {
        name: 'sandbox:sandbox',
        taskReferenceName: 'sandbox:sandbox_tbbmtp6w',
        type: 'SIMPLE',
        inputParameters: {
          __advancedConfig: {
            timeout: 3600,
          },
          language: 'node-js',
          parameters: {
            input: '${third_party_api:tripo_3d_generate_JQBCCDKQ.output.output}',
          },
          sourceCode: 'return "这是3D模型url："+$.input.pbr_model',
        },
      },
    ],
    output: null,
  },
};

/**
 * 导出所有示例
 */
export const WORKFLOW_EXAMPLES: WorkflowExample[] = [
  MULTI_MODEL_TEXT_TO_IMAGE_EXAMPLE,
  IMAGE_TO_IMAGE_EXAMPLE,
  FAL_AI_UPSCALE_EXAMPLE,
  TRIPO_3D_WITH_CODE_EXAMPLE,
];

/**
 * 根据场景获取示例
 */
export function getExampleByScenario(scenario: string): WorkflowExample | null {
  return WORKFLOW_EXAMPLES.find((ex) => ex.scenario.toLowerCase().includes(scenario.toLowerCase())) || null;
}
