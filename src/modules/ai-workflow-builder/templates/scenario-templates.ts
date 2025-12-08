import { WorkflowTemplate } from './template.interface';

/**
 * 预定义的工作流场景模板
 *
 * ⚠️ 重要：所有工具名称和参数结构必须100%正确，直接从实际工具定义中提取
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  /**
   * 模板1：Gemini 3 Pro 文生图工作流
   */
  {
    scenario: 'gemini-text-to-image',
    displayName: {
      'zh-CN': 'Gemini 3 Pro 文生图工作流',
      'en-US': 'Gemini 3 Pro Text-to-Image Workflow',
    },
    description: {
      'zh-CN': '使用 Google Gemini 3 Pro 模型根据文本提示生成高质量图像',
      'en-US': 'Generate high-quality images from text prompts using Google Gemini 3 Pro',
    },
    requiredTools: ['third_party_api:gemini_3_pro_image_generate'],
    keywords: ['gemini', '文生图', 'text-to-image', 't2i', 'gemini 3 pro', 'gemini3'],
    userPromptExample: '创建文生图工作流，使用Gemini 3 Pro，用户输入提示词、选择分辨率和宽高比',
    workflowExample: {
      displayName: {
        'zh-CN': 'Gemini 3 Pro 文生图',
        'en-US': 'Gemini 3 Pro Text-to-Image',
      },
      description: {
        'zh-CN': '使用 Gemini 3 Pro 模型生成图片',
        'en-US': 'Generate images using Gemini 3 Pro model',
      },
      iconUrl: 'emoji:🎨:#4285F4',
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
          description: {
            'zh-CN': '描述你想生成的图片内容',
            'en-US': 'Describe the image you want to generate',
          },
        },
        {
          name: 'aspect_ratio',
          displayName: {
            'zh-CN': '宽高比',
            'en-US': 'Aspect Ratio',
          },
          type: 'string',
          required: false,
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
              { label: { 'zh-CN': '4:5 (896x1152)' }, value: '4:5' },
              { label: { 'zh-CN': '5:4 (1152x896)' }, value: '5:4' },
              { label: { 'zh-CN': '9:16 (768x1344)' }, value: '9:16' },
              { label: { 'zh-CN': '16:9 (1344x768)' }, value: '16:9' },
              { label: { 'zh-CN': '21:9 (1536x672)' }, value: '21:9' },
            ],
          },
        },
        {
          name: 'image_size',
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
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:gemini_3_pro_image_generate', // ✅ 正确的工具完整名称
          taskReferenceName: 'generate_image_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成图片',
            'en-US': 'Generate Image',
          },
          inputParameters: {
            // ✅ 正确的参数结构：嵌套在 input 对象内
            input: {
              prompt: '${workflow.input.prompt}',
              aspect_ratio: '${workflow.input.aspect_ratio}',
              image_size: '${workflow.input.image_size}',
            },
          },
        },
      ],
      output: [
        {
          key: 'images',
          value: '${generate_image_task.output.images}',
        },
        {
          key: 'text',
          value: '${generate_image_task.output.text}',
        },
      ],
    },
  },

  /**
   * 模板2：即梦 Ark 文生图工作流
   */
  {
    scenario: 'jimeng-text-to-image',
    displayName: {
      'zh-CN': '即梦 Ark 文生图工作流',
      'en-US': 'Jimeng Ark Text-to-Image Workflow',
    },
    description: {
      'zh-CN': '使用即梦 Ark 平台的 AI 模型生成图片',
      'en-US': 'Generate images using Jimeng Ark AI platform',
    },
    requiredTools: ['third_party_api:jimeng_ark_generate'],
    keywords: ['即梦', 'jimeng', '文生图', 'seedream'],
    userPromptExample: '创建文生图工作流，使用即梦，用户输入提示词和分辨率',
    workflowExample: {
      displayName: {
        'zh-CN': '即梦 AI 文生图',
        'en-US': 'Jimeng AI Text-to-Image',
      },
      description: {
        'zh-CN': '使用即梦 4.0 模型生成图片',
        'en-US': 'Generate images using Jimeng 4.0 model',
      },
      iconUrl: 'emoji:🎨:#e74c3c',
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
          name: 'size',
          displayName: {
            'zh-CN': '图像尺寸',
            'en-US': 'Image Size',
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
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:jimeng_ark_generate', // ✅ 正确的工具名称
          taskReferenceName: 'jimeng_generate_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '即梦生图',
            'en-US': 'Jimeng Generate',
          },
          inputParameters: {
            // ✅ 正确的参数结构：嵌套在 input 对象内
            input: {
              prompt: '${workflow.input.prompt}',
              size: '${workflow.input.size}',
              seed: -1,
              response_format: 'url',
              watermark: true,
            },
          },
        },
      ],
      output: [
        {
          key: 'data',
          value: '${jimeng_generate_task.output.data}',
        },
      ],
    },
  },

  /**
   * 模板3：多模型文生图工作流（使用 SWITCH 节点）
   */
  {
    scenario: 'multi-model-text-to-image',
    displayName: {
      'zh-CN': '多模型文生图工作流',
      'en-US': 'Multi-Model Text-to-Image Workflow',
    },
    description: {
      'zh-CN': '支持用户选择不同 AI 模型（Gemini、OpenAI、即梦）生成图片',
      'en-US': 'Support multiple AI models (Gemini, OpenAI, Jimeng) for image generation',
    },
    requiredTools: ['third_party_api:gemini_3_pro_image_generate', 'third_party_api:openai_gpt4_vision', 'third_party_api:jimeng_ark_generate'],
    keywords: ['多模型', 'multi-model', 'gemini', 'gpt', 'openai', 'jimeng', '即梦', '选择模型'],
    userPromptExample: '创建文生图工作流，支持 Gemini、GPT、即梦三个模型，用户选择模型并输入提示词',
    workflowExample: {
      displayName: {
        'zh-CN': '多模型 AI 文生图',
        'en-US': 'Multi-Model AI Text-to-Image',
      },
      description: {
        'zh-CN': '根据用户选择使用不同的 AI 模型生成图片',
        'en-US': 'Generate images using different AI models based on user selection',
      },
      iconUrl: 'emoji:🎨:#7fa3f8',
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
          name: 'model',
          displayName: {
            'zh-CN': '模型选择',
            'en-US': 'AI Model',
          },
          type: 'string',
          required: true,
          default: 'gemini',
          typeOptions: {
            enableSelectList: true,
            selectListDisplayMode: 'dropdown',
            selectList: [
              { label: { 'zh-CN': 'Gemini 3 Pro', 'en-US': 'Gemini 3 Pro' }, value: 'gemini' },
              { label: { 'zh-CN': 'GPT-4 Vision', 'en-US': 'GPT-4 Vision' }, value: 'gpt' },
              { label: { 'zh-CN': '即梦 AI', 'en-US': 'Jimeng AI' }, value: 'jimeng' },
            ],
          },
        },
      ],
      tasks: [
        {
          name: 'switch_model_selection',
          taskReferenceName: 'model_selector',
          type: 'SWITCH',
          displayName: {
            'zh-CN': '模型选择',
            'en-US': 'Model Selection',
          },
          inputParameters: {
            evaluatorType: 'javascript',
            expression: '$.workflow.input.model',
            parameters: {
              model: '${workflow.input.model}',
            },
          },
          decisionCases: {
            gemini: [
              {
                name: 'third_party_api:gemini_3_pro_image_generate', // ✅ 正确工具名
                taskReferenceName: 'gemini_generate',
                type: 'SIMPLE',
                displayName: {
                  'zh-CN': 'Gemini 生图',
                  'en-US': 'Gemini Generate',
                },
                inputParameters: {
                  input: {
                    // ✅ 正确的参数结构
                    prompt: '${workflow.input.prompt}',
                    aspect_ratio: '16:9',
                    image_size: '2K',
                  },
                },
              },
            ],
            gpt: [
              {
                name: 'third_party_api:openai_gpt4_vision', // ✅ 正确工具名
                taskReferenceName: 'gpt_generate',
                type: 'SIMPLE',
                displayName: {
                  'zh-CN': 'GPT 生图',
                  'en-US': 'GPT Generate',
                },
                inputParameters: {
                  input: {
                    // ✅ 正确的参数结构
                    prompt: '${workflow.input.prompt}',
                    model: 'gpt-4o',
                    size: '1024x1024',
                    quality: 'high',
                  },
                },
              },
            ],
            jimeng: [
              {
                name: 'third_party_api:jimeng_ark_generate', // ✅ 正确工具名
                taskReferenceName: 'jimeng_generate',
                type: 'SIMPLE',
                displayName: {
                  'zh-CN': '即梦生图',
                  'en-US': 'Jimeng Generate',
                },
                inputParameters: {
                  input: {
                    // ✅ 正确的参数结构
                    prompt: '${workflow.input.prompt}',
                    size: '2K',
                    seed: -1,
                  },
                },
              },
            ],
          },
          defaultCase: [],
        },
      ],
      output: [
        {
          key: 'result',
          value: '${model_selector.output}',
        },
      ],
    },
  },

  /**
   * 模板4：Runway 图生视频工作流
   */
  {
    scenario: 'runway-image-to-video',
    displayName: {
      'zh-CN': 'Runway 图生视频工作流',
      'en-US': 'Runway Image-to-Video Workflow',
    },
    description: {
      'zh-CN': '使用 Runway 将静态图片转换为动态视频',
      'en-US': 'Convert static images to dynamic videos using Runway',
    },
    requiredTools: ['third_party_api:runway_image_to_video'],
    keywords: ['runway', '图生视频', 'image-to-video', 'i2v', '图片转视频', '视频'],
    userPromptExample: '创建图生视频工作流，使用Runway，用户输入图片URL和视频时长',
    workflowExample: {
      displayName: {
        'zh-CN': 'Runway 图片转视频',
        'en-US': 'Runway Image-to-Video',
      },
      description: {
        'zh-CN': '使用 Runway 将图片转换为视频',
        'en-US': 'Convert images to videos using Runway',
      },
      iconUrl: 'emoji:🎬:#00D4FF',
      variables: [
        {
          name: 'image_url',
          displayName: {
            'zh-CN': '图片URL',
            'en-US': 'Image URL',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '请输入图片URL',
              'en-US': 'Enter image URL',
            },
          },
        },
        {
          name: 'duration',
          displayName: {
            'zh-CN': '视频时长(秒)',
            'en-US': 'Duration (seconds)',
          },
          type: 'number',
          required: false,
          default: 5,
          typeOptions: {
            min: 5,
            max: 10,
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:runway_image_to_video',
          taskReferenceName: 'runway_i2v_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '图片转视频',
            'en-US': 'Image to Video',
          },
          inputParameters: {
            input: {
              imageUrl: '${workflow.input.image_url}',
              duration: '${workflow.input.duration}',
            },
          },
        },
      ],
      output: [
        {
          key: 'taskId',
          value: '${runway_i2v_task.output.taskId}',
        },
        {
          key: 'status',
          value: '${runway_i2v_task.output.status}',
        },
      ],
    },
  },

  /**
   * 模板5：Google 搜索工作流
   */
  {
    scenario: 'google-search',
    displayName: {
      'zh-CN': 'Google 搜索工作流',
      'en-US': 'Google Search Workflow',
    },
    description: {
      'zh-CN': '使用 Google 搜索引擎查找信息',
      'en-US': 'Search for information using Google Search',
    },
    requiredTools: ['third_party_api:google_search'],
    keywords: ['google', '搜索', 'search', '查找', '检索'],
    userPromptExample: '创建搜索工作流，使用Google搜索，用户输入搜索关键词',
    workflowExample: {
      displayName: {
        'zh-CN': 'Google 搜索',
        'en-US': 'Google Search',
      },
      description: {
        'zh-CN': '使用 Google 搜索引擎查找信息',
        'en-US': 'Search using Google',
      },
      iconUrl: 'emoji:🔍:#4285F4',
      variables: [
        {
          name: 'query',
          displayName: {
            'zh-CN': '搜索关键词',
            'en-US': 'Search Query',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '请输入搜索关键词',
              'en-US': 'Enter search query',
            },
          },
        },
        {
          name: 'num',
          displayName: {
            'zh-CN': '结果数量',
            'en-US': 'Number of Results',
          },
          type: 'number',
          required: false,
          default: 10,
          typeOptions: {
            min: 1,
            max: 100,
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:google_search',
          taskReferenceName: 'search_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '执行搜索',
            'en-US': 'Execute Search',
          },
          inputParameters: {
            input: {
              query: '${workflow.input.query}',
              num: '${workflow.input.num}',
            },
          },
        },
      ],
      output: [
        {
          key: 'organic',
          value: '${search_task.output.organic}',
        },
        {
          key: 'answerBox',
          value: '${search_task.output.answerBox}',
        },
      ],
    },
  },

  /**
   * 模板6：Tripo 3D模型生成工作流
   */
  {
    scenario: 'tripo-3d-generation',
    displayName: {
      'zh-CN': 'Tripo 3D模型生成工作流',
      'en-US': 'Tripo 3D Model Generation Workflow',
    },
    description: {
      'zh-CN': '使用 Tripo AI 生成3D模型',
      'en-US': 'Generate 3D models using Tripo AI',
    },
    requiredTools: ['third_party_api:tripo_generate'],
    keywords: ['tripo', '3d', '3D模型', '三维', 'model', '建模'],
    userPromptExample: '创建3D模型生成工作流，使用Tripo，用户输入描述或图片',
    workflowExample: {
      displayName: {
        'zh-CN': 'Tripo 3D模型生成',
        'en-US': 'Tripo 3D Model Generation',
      },
      description: {
        'zh-CN': '使用 Tripo AI 生成3D模型',
        'en-US': 'Generate 3D models using Tripo AI',
      },
      iconUrl: 'emoji:🎲:#9C27B0',
      variables: [
        {
          name: 'prompt',
          displayName: {
            'zh-CN': '模型描述',
            'en-US': 'Model Description',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '描述你想生成的3D模型',
              'en-US': 'Describe the 3D model you want',
            },
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:tripo_generate',
          taskReferenceName: 'tripo_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成3D模型',
            'en-US': 'Generate 3D Model',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.prompt}',
            },
          },
        },
      ],
      output: [
        {
          key: 'taskId',
          value: '${tripo_task.output.taskId}',
        },
        {
          key: 'model',
          value: '${tripo_task.output.model}',
        },
      ],
    },
  },

  /**
   * 模板7：Plotly 数据可视化工作流
   */
  {
    scenario: 'plotly-visualization',
    displayName: {
      'zh-CN': 'Plotly 数据可视化工作流',
      'en-US': 'Plotly Data Visualization Workflow',
    },
    description: {
      'zh-CN': '使用 Plotly 创建交互式图表',
      'en-US': 'Create interactive charts using Plotly',
    },
    requiredTools: ['third_party_api:plotly_visualize'],
    keywords: ['plotly', '可视化', 'visualization', '图表', 'chart', '数据'],
    userPromptExample: '创建数据可视化工作流，使用Plotly，用户输入数据和图表配置',
    workflowExample: {
      displayName: {
        'zh-CN': 'Plotly 数据可视化',
        'en-US': 'Plotly Data Visualization',
      },
      description: {
        'zh-CN': '使用 Plotly 创建交互式图表',
        'en-US': 'Create charts using Plotly',
      },
      iconUrl: 'emoji:📊:#3F51B5',
      variables: [
        {
          name: 'chart_data',
          displayName: {
            'zh-CN': '图表数据',
            'en-US': 'Chart Data',
          },
          type: 'json',
          required: true,
        },
        {
          name: 'chart_layout',
          displayName: {
            'zh-CN': '图表布局',
            'en-US': 'Chart Layout',
          },
          type: 'json',
          required: false,
        },
      ],
      tasks: [
        {
          name: 'third_party_api:plotly_visualize',
          taskReferenceName: 'plotly_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成图表',
            'en-US': 'Generate Chart',
          },
          inputParameters: {
            input: {
              data: '${workflow.input.chart_data}',
              layout: '${workflow.input.chart_layout}',
            },
          },
        },
      ],
      output: [
        {
          key: 'url',
          value: '${plotly_task.output.url}',
        },
        {
          key: 'html',
          value: '${plotly_task.output.html}',
        },
      ],
    },
  },

  /**
   * 模板8：BFL AI 文生图工作流
   */
  {
    scenario: 'bfl-text-to-image',
    displayName: {
      'zh-CN': 'BFL AI 文生图工作流',
      'en-US': 'BFL AI Text-to-Image Workflow',
    },
    description: {
      'zh-CN': '使用 BFL AI 生成高质量图像',
      'en-US': 'Generate high-quality images using BFL AI',
    },
    requiredTools: ['third_party_api:bfl_ai_generate'],
    keywords: ['bfl', 'flux', '文生图', 'text-to-image', 't2i'],
    userPromptExample: '创建文生图工作流，使用BFL AI，用户输入提示词',
    workflowExample: {
      displayName: {
        'zh-CN': 'BFL AI 文生图',
        'en-US': 'BFL AI Text-to-Image',
      },
      description: {
        'zh-CN': '使用 BFL AI Flux 模型生成图片',
        'en-US': 'Generate images using BFL AI Flux model',
      },
      iconUrl: 'emoji:🎨:#FF6B6B',
      variables: [
        {
          name: 'prompt',
          displayName: {
            'zh-CN': '提示词',
            'en-US': 'Prompt',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '描述你想生成的图片',
              'en-US': 'Describe the image you want',
            },
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:bfl_ai_generate',
          taskReferenceName: 'bfl_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成图片',
            'en-US': 'Generate Image',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.prompt}',
            },
          },
        },
      ],
      output: [
        {
          key: 'images',
          value: '${bfl_task.output.images}',
        },
      ],
    },
  },

  /**
   * 模板9：单位转换工作流
   */
  {
    scenario: 'unit-conversion',
    displayName: {
      'zh-CN': '单位转换工作流',
      'en-US': 'Unit Conversion Workflow',
    },
    description: {
      'zh-CN': '支持货币、长度、重量等单位转换',
      'en-US': 'Support currency, length, weight conversion',
    },
    requiredTools: ['third_party_api:unit_converter'],
    keywords: ['单位', '转换', 'conversion', 'unit', '货币', 'currency'],
    userPromptExample: '创建单位转换工作流，用户输入数值和转换单位',
    workflowExample: {
      displayName: {
        'zh-CN': '单位转换',
        'en-US': 'Unit Conversion',
      },
      description: {
        'zh-CN': '支持多种单位转换',
        'en-US': 'Support multiple unit conversions',
      },
      iconUrl: 'emoji:🔄:#4CAF50',
      variables: [
        {
          name: 'value',
          displayName: {
            'zh-CN': '数值',
            'en-US': 'Value',
          },
          type: 'number',
          required: true,
        },
        {
          name: 'from_unit',
          displayName: {
            'zh-CN': '源单位',
            'en-US': 'From Unit',
          },
          type: 'string',
          required: true,
        },
        {
          name: 'to_unit',
          displayName: {
            'zh-CN': '目标单位',
            'en-US': 'To Unit',
          },
          type: 'string',
          required: true,
        },
      ],
      tasks: [
        {
          name: 'third_party_api:unit_converter',
          taskReferenceName: 'convert_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '执行转换',
            'en-US': 'Execute Conversion',
          },
          inputParameters: {
            input: {
              value: '${workflow.input.value}',
              from: '${workflow.input.from_unit}',
              to: '${workflow.input.to_unit}',
            },
          },
        },
      ],
      output: [
        {
          key: 'result',
          value: '${convert_task.output.result}',
        },
      ],
    },
  },

  /**
   * 模板10：文生图+图生视频组合工作流
   */
  {
    scenario: 'text-to-image-to-video',
    displayName: {
      'zh-CN': '文生图+图生视频组合工作流',
      'en-US': 'Text-to-Image-to-Video Workflow',
    },
    description: {
      'zh-CN': '先生成图片，再将图片转换为视频',
      'en-US': 'Generate image first, then convert to video',
    },
    requiredTools: ['third_party_api:gemini_3_pro_image_generate', 'third_party_api:runway_image_to_video'],
    keywords: ['文生图', '图生视频', 'text-to-video', '视频', '图片', 'gemini', 'runway'],
    userPromptExample: '创建文生图+图生视频工作流，先用Gemini生成图片，再用Runway转视频',
    workflowExample: {
      displayName: {
        'zh-CN': '文生图+图生视频',
        'en-US': 'Text-to-Image-to-Video',
      },
      description: {
        'zh-CN': '使用 Gemini 生成图片，然后用 Runway 转换为视频',
        'en-US': 'Generate image with Gemini, then convert to video with Runway',
      },
      iconUrl: 'emoji:🎬:#FF9800',
      variables: [
        {
          name: 'prompt',
          displayName: {
            'zh-CN': '提示词',
            'en-US': 'Prompt',
          },
          type: 'string',
          required: true,
        },
        {
          name: 'duration',
          displayName: {
            'zh-CN': '视频时长',
            'en-US': 'Video Duration',
          },
          type: 'number',
          required: false,
          default: 5,
        },
      ],
      tasks: [
        {
          name: 'third_party_api:gemini_3_pro_image_generate',
          taskReferenceName: 'generate_image',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成图片',
            'en-US': 'Generate Image',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.prompt}',
              aspect_ratio: '16:9',
            },
          },
        },
        {
          name: 'third_party_api:runway_image_to_video',
          taskReferenceName: 'convert_to_video',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '转换为视频',
            'en-US': 'Convert to Video',
          },
          inputParameters: {
            input: {
              imageUrl: '${generate_image.output.images[0].url}',
              duration: '${workflow.input.duration}',
            },
          },
        },
      ],
      output: [
        {
          key: 'imageUrl',
          value: '${generate_image.output.images[0].url}',
        },
        {
          key: 'videoTaskId',
          value: '${convert_to_video.output.taskId}',
        },
      ],
    },
  },

  /**
   * 模板11：OpenAI GPT 对话工作流
   */
  {
    scenario: 'openai-chat',
    displayName: {
      'zh-CN': 'OpenAI GPT 对话工作流',
      'en-US': 'OpenAI GPT Chat Workflow',
    },
    description: {
      'zh-CN': '使用 OpenAI GPT 模型进行对话和文本生成',
      'en-US': 'Chat and text generation using OpenAI GPT models',
    },
    requiredTools: ['third_party_api:openai_generate'],
    keywords: ['openai', 'gpt', 'chatgpt', '对话', 'chat', '文本生成'],
    userPromptExample: '创建AI对话工作流，使用OpenAI GPT，用户输入问题或提示词',
    workflowExample: {
      displayName: {
        'zh-CN': 'OpenAI GPT 对话',
        'en-US': 'OpenAI GPT Chat',
      },
      description: {
        'zh-CN': '使用 GPT 模型进行智能对话',
        'en-US': 'Intelligent chat using GPT models',
      },
      iconUrl: 'emoji:💬:#00A67E',
      variables: [
        {
          name: 'prompt',
          displayName: {
            'zh-CN': '提示词',
            'en-US': 'Prompt',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '输入你的问题或指令',
              'en-US': 'Enter your question or instruction',
            },
          },
        },
        {
          name: 'model',
          displayName: {
            'zh-CN': '模型',
            'en-US': 'Model',
          },
          type: 'string',
          required: false,
          default: 'gpt-4o',
          typeOptions: {
            enableSelectList: true,
            selectListDisplayMode: 'dropdown',
            selectList: [
              { label: { 'zh-CN': 'GPT-4o' }, value: 'gpt-4o' },
              { label: { 'zh-CN': 'GPT-4' }, value: 'gpt-4' },
              { label: { 'zh-CN': 'GPT-3.5 Turbo' }, value: 'gpt-3.5-turbo' },
            ],
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:openai_generate',
          taskReferenceName: 'openai_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': 'GPT生成',
            'en-US': 'GPT Generate',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.prompt}',
              model: '${workflow.input.model}',
            },
          },
        },
      ],
      output: [
        {
          key: 'response',
          value: '${openai_task.output.response}',
        },
      ],
    },
  },

  /**
   * 模板12：Fal AI 文生图工作流
   */
  {
    scenario: 'fal-text-to-image',
    displayName: {
      'zh-CN': 'Fal AI 文生图工作流',
      'en-US': 'Fal AI Text-to-Image Workflow',
    },
    description: {
      'zh-CN': '使用 Fal AI 快速生成高质量图像',
      'en-US': 'Generate high-quality images quickly using Fal AI',
    },
    requiredTools: ['third_party_api:fal_ai_subscribe'],
    keywords: ['fal', 'fal ai', '文生图', 'text-to-image', 't2i', 'stable diffusion'],
    userPromptExample: '创建文生图工作流，使用Fal AI，用户输入提示词',
    workflowExample: {
      displayName: {
        'zh-CN': 'Fal AI 文生图',
        'en-US': 'Fal AI Text-to-Image',
      },
      description: {
        'zh-CN': '使用 Fal AI 快速生成图片',
        'en-US': 'Generate images quickly using Fal AI',
      },
      iconUrl: 'emoji:🎨:#8B5CF6',
      variables: [
        {
          name: 'prompt',
          displayName: {
            'zh-CN': '提示词',
            'en-US': 'Prompt',
          },
          type: 'string',
          required: true,
          typeOptions: {
            placeholder: {
              'zh-CN': '描述你想生成的图片',
              'en-US': 'Describe the image you want',
            },
          },
        },
      ],
      tasks: [
        {
          name: 'third_party_api:fal_ai_subscribe',
          taskReferenceName: 'fal_task',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成图片',
            'en-US': 'Generate Image',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.prompt}',
            },
          },
        },
      ],
      output: [
        {
          key: 'images',
          value: '${fal_task.output.images}',
        },
      ],
    },
  },

  /**
   * 模板13：搜索+生成组合工作流
   */
  {
    scenario: 'search-and-generate',
    displayName: {
      'zh-CN': '搜索+内容生成组合工作流',
      'en-US': 'Search and Generate Combo Workflow',
    },
    description: {
      'zh-CN': '先搜索相关信息，再基于搜索结果生成内容',
      'en-US': 'Search for information first, then generate content based on results',
    },
    requiredTools: ['third_party_api:google_search', 'third_party_api:gemini_3_pro_image_generate'],
    keywords: ['搜索', 'search', '生成', 'generate', '组合', 'combo', 'google'],
    userPromptExample: '创建搜索+生成工作流，先用Google搜索，再根据结果生成图片',
    workflowExample: {
      displayName: {
        'zh-CN': '搜索+生成',
        'en-US': 'Search & Generate',
      },
      description: {
        'zh-CN': '搜索相关信息后生成可视化内容',
        'en-US': 'Search and generate visual content',
      },
      iconUrl: 'emoji:🔍:#FFA726',
      variables: [
        {
          name: 'search_query',
          displayName: {
            'zh-CN': '搜索关键词',
            'en-US': 'Search Query',
          },
          type: 'string',
          required: true,
        },
        {
          name: 'image_prompt',
          displayName: {
            'zh-CN': '图片提示词',
            'en-US': 'Image Prompt',
          },
          type: 'string',
          required: true,
        },
      ],
      tasks: [
        {
          name: 'third_party_api:google_search',
          taskReferenceName: 'search_info',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '搜索信息',
            'en-US': 'Search Info',
          },
          inputParameters: {
            input: {
              query: '${workflow.input.search_query}',
              num: 5,
            },
          },
        },
        {
          name: 'third_party_api:gemini_3_pro_image_generate',
          taskReferenceName: 'generate_content',
          type: 'SIMPLE',
          displayName: {
            'zh-CN': '生成内容',
            'en-US': 'Generate Content',
          },
          inputParameters: {
            input: {
              prompt: '${workflow.input.image_prompt}',
              aspect_ratio: '16:9',
            },
          },
        },
      ],
      output: [
        {
          key: 'searchResults',
          value: '${search_info.output.organic}',
        },
        {
          key: 'images',
          value: '${generate_content.output.images}',
        },
      ],
    },
  },
];

/**
 * 根据用户描述查找匹配的场景模板
 */
export function findMatchingTemplate(userDescription: string): WorkflowTemplate | null {
  const lowerDesc = userDescription.toLowerCase();

  // 统计提到的模型数量
  const mentionedModels = [/gemini|谷歌/i.test(lowerDesc), /gpt|openai|chatgpt/i.test(lowerDesc), /即梦|jimeng|seedream/i.test(lowerDesc)].filter(Boolean).length;

  // 如果提到2个或以上模型，优先使用多模型模板
  if (mentionedModels >= 2 || /(多|多个|选择|切换).*模型/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'multi-model-text-to-image') || null;
  }

  // 检测组合场景：文生图+图生视频
  if (/(文生图|生成图片).*视频|视频.*文生图/i.test(lowerDesc) || /(图片|image).*视频/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'text-to-image-to-video') || null;
  }

  // 否则使用关键词匹配
  for (const template of WORKFLOW_TEMPLATES) {
    const matchScore = template.keywords.filter((keyword) => {
      return lowerDesc.includes(keyword.toLowerCase());
    }).length;

    // 如果匹配到3个或以上关键词，认为匹配成功
    if (matchScore >= 3) {
      return template;
    }

    // 如果关键词较少但匹配度高，也认为成功
    if (matchScore >= 2 && template.keywords.length <= 4) {
      return template;
    }
  }

  // 降级匹配：只要提到一个关键工具名
  if (/gemini.*3.*pro|gemini3/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'gemini-text-to-image') || null;
  }
  if (/即梦|jimeng/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'jimeng-text-to-image') || null;
  }
  if (/runway.*image.*video|图生视频/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'runway-image-to-video') || null;
  }
  if (/tripo|3d.*模型/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'tripo-3d-generation') || null;
  }
  if (/google.*搜索|search/i.test(lowerDesc) && !/(生成|generate|图片|image)/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'google-search') || null;
  }
  if (/(google.*搜索|search).*(生成|generate)/i.test(lowerDesc) || /(生成|generate).*(搜索|search)/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'search-and-generate') || null;
  }
  if (/plotly|可视化|visualization/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'plotly-visualization') || null;
  }
  if (/bfl|flux/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'bfl-text-to-image') || null;
  }
  if (/fal.*ai|fal.*sd/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'fal-text-to-image') || null;
  }
  if (/单位.*转换|unit.*conversion/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'unit-conversion') || null;
  }
  if (/(openai|gpt|chatgpt).*(对话|chat)/i.test(lowerDesc)) {
    return WORKFLOW_TEMPLATES.find((t) => t.scenario === 'openai-chat') || null;
  }

  return null;
}
