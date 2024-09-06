import { LlmChannelEntity } from '@/database/entities/assets/model/llm-channel/llm-channel.entity';
import { ToolProperty } from '@inf-monkeys/monkeys';

export interface OneAPIChannel {
  key: number;
  text: string;
  value: number;
  color: string;
  icon: string;
  properites: ToolProperty[];
}

export const COMMON_DEFAULT_CHANNEL_PROPERITIES: ToolProperty[] = [
  {
    displayName: {
      'zh-CN': '自定义模型供应商名称',
      'en-US': 'Custom Model Supplier Name',
    },
    name: 'displayName',
    type: 'string',
    required: false,
    typeOptions: {
      foldUp: true,
    },
  },
  {
    displayName: {
      'zh-CN': '自定义模型供应商描述',
      'en-US': 'Custom Model Supplier Description',
    },
    name: 'description',
    type: 'string',
    required: false,
    typeOptions: {
      foldUp: true,
    },
  },
];

export const DEFAULT_ONEAPI_CHANNEL_PROPERITIES: ToolProperty[] = [
  {
    displayName: {
      'zh-CN': '密钥',
      'en-US': 'Key',
    },
    name: 'key',
    type: 'string',
    required: true,
    description: {
      'zh-CN': '在此处填写模型供应商提供的 APIKEY',
      'en-US': 'Enter the APIKEY provided by the model supplier here',
    },
  },
  {
    displayName: {
      'zh-CN': '模型列表',
      'en-US': 'Model List',
    },
    name: 'models',
    type: 'string',
    required: true,
    default: [],
    typeOptions: {
      assetType: 'oneapi-model',
      multipleValues: true,
    },
  },
  {
    displayName: 'Base URL',
    name: 'base_url',
    type: 'string',
    required: false,
    description: {
      'zh-CN': '可选，不填默认使用官方的默认地址，如 https://domain.com',
      'en-US': 'Optional, if not filled in, the official default address will be used by default, such as https://domain.com',
    },
    typeOptions: {
      foldUp: true,
    },
  },
  ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
];

export const ONEAPI_CHANNELS: Partial<LlmChannelEntity>[] = [
  {
    id: '1',
    displayName: 'OpenAI',
    description: {
      'en-US':
        'OpenAI is an American artificial intelligence research organization founded in December 2015, researching artificial intelligence with the goal of developing "safe and beneficial" artificial general intelligence, which it defines as "highly autonomous systems that outperform humans at most economically valuable work.',
      'zh-CN':
        'OpenAI 是一家成立于 2015 年 12 月的美国人工智能研究组织，研究人工智能的目标是开发“安全和有益”的人工智能通用智能，OpenAI 将其定义为“高度自主的系统，在大多数经济上有价值的工作中胜过人类。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/openai.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    displayName: 'Azure OpenAI',
    id: '3',
    description: {
      'en-US': 'Azure OpenAI offers private networking, regional availability, and responsible AI content filtering',
      'zh-CN': 'Azure OpenAI 提供私有网络、区域可用性和负责任的 AI 内容过滤。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/azure.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'apiKey',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '在此处填写模型 Azure 供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the Azure model supplier here',
        },
      },
      {
        displayName: {
          'zh-CN': '模型列表',
          'en-US': 'Model List',
        },
        description: {
          'zh-CN': '模型部署名称必须和模型名称保持一致，因为系统会把请求体中的 model 参数替换为你的部署名称（模型名称中的点会被剔除）',
          'en-US':
            'The model deployment name must be consistent with the model name, because the system will replace the model parameter in the request body with your deployment name (the dot in the model name will be removed)',
        },
        name: 'models',
        type: 'string',
        required: true,
        default: [],
        typeOptions: {
          assetType: 'oneapi-model',
          multipleValues: true,
        },
      },
      {
        displayName: 'Azure Base URL',
        name: 'azure_base_url',
        description: {
          'zh-CN': '请输入 AZURE_OPENAI_ENDPOINT，例如：https://docs-test-001.openai.azure.com',
          'en-US': 'Please enter AZURE_OPENAI_ENDPOINT, for example: https://docs-test-001.openai.azure.com',
        },
        type: 'string',
        required: false,
        typeOptions: {
          foldUp: true,
        },
      },
      {
        displayName: {
          'zh-CN': '默认 API 版本',
          'en-US': 'Default API Version',
        },
        name: 'azure_other',
        description: {
          'zh-CN': '请输入默认 API 版本，例如：2024-03-01-preview，该配置可以被实际的请求查询参数所覆盖',
          'en-US': 'Please enter the default API version, for example: 2024-03-01-preview, this configuration can be overridden by the actual request query parameters',
        },
        type: 'string',
        required: false,
        typeOptions: {
          foldUp: true,
        },
      },
      ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
    ],
  },
  {
    id: '14',
    displayName: 'Anthropic Claude',
    description: {
      'en-US': 'Claude is a family of large language models developed by Anthropic. The first model was released in March 2023. Claude 3, released in March 2024, can also analyze images',
      'zh-CN': 'Claude 是由 Anthropic 开发的大型语言模型系列。第一个模型于 2023 年 3 月发布。2024 年 3 月发布的 Claude 3 还可以分析图像。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/claude.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '33',
    displayName: 'AWS',
    description: {
      'zh-CN': '在 AWS 上开启人工智能创新 — 借助人工智能工具、解决方案和基础设施领域久经考验的领导者，实现运营转型。',
      'en-US': 'Unlock AI innovation on AWS - Transform your operations with the proven leader in artificial intelligence tools, solutions, and infrastructure.',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/aws.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '区域',
          'en-US': 'Region',
        },
        name: 'region',
        type: 'string',
        required: true,
        placeholder: 'region，e.g. us-west-2',
        description: {
          'zh-CN': '在此处填写 AWS 区域，例如：us-west-2',
          'en-US': 'Enter the AWS region here, for example: us-west-2',
        },
      },
      {
        displayName: 'AK',
        name: 'ak',
        type: 'string',
        required: true,
        placeholder: 'AWS IAM Access Key',
        description: {
          'zh-CN': '在此处填写 AWS IAM Access Key',
          'en-US': 'Enter the AWS IAM Access Key here',
        },
      },
      {
        displayName: 'SK',
        name: 'sk',
        type: 'string',
        required: true,
        placeholder: 'AWS IAM Secret Key',
        description: {
          'zh-CN': '在此处填写 AWS IAM Secret Key',
          'en-US': 'Enter the AWS IAM Secret Key here',
        },
      },
      {
        displayName: {
          'zh-CN': '模型列表',
          'en-US': 'Model List',
        },
        name: 'models',
        type: 'string',
        required: true,
        default: [],
        typeOptions: {
          assetType: 'oneapi-model',
          multipleValues: true,
        },
      },
      ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
    ],
  },
  {
    id: '11',
    displayName: 'Google PaLM2',
    description: {
      'en-US': "PaLM 2 is our next generation language model with improved multilingual, reasoning and coding capabilities that builds on Google's legacy of breakthrough ...",
      'zh-CN': 'PaLM 2 是我们的下一代语言模型，具有改进的多语言、推理和编码能力，是基于谷歌突破性的遗产构建的...',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/GooglePaLM2.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '24',
    displayName: 'Google Gemini',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/google_gemini.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US':
        "Google Gemini is a family of multimodal large language models developed by Google DeepMind, serving as the successor to LaMDA and PaLM 2. Comprising Gemini Ultra, Gemini Pro, Gemini Flash, and Gemini Nano, it was announced on December 6, 2023, positioned as a competitor to OpenAI's GPT-4",
      'zh-CN':
        'Google Gemini 是由 Google DeepMind 开发的一系列多模态大型语言模型，是 LaMDA 和 PaLM 2 的继任者。由 Gemini Ultra、Gemini Pro、Gemini Flash 和 Gemini Nano 组成，于 2023 年 12 月 6 日宣布，定位为 OpenAI 的 GPT-4 的竞争对手',
    },
  },
  {
    id: '28',
    displayName: 'Mistral AI',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/MistralAI.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US':
        'Mistral AI is a French company specializing in artificial intelligence products. Founded in April 2023 by former employees of Meta Platforms and Google DeepMind, the company has quickly risen to prominence in the AI sector.',
      'zh-CN': 'Mistral AI 是一家专门从事人工智能产品的法国公司。该公司成立于 2023 年 4 月，由 Meta Platforms 和 Google DeepMind 的前员工创立，公司迅速在人工智能领域崭露头角。',
    },
  },
  {
    id: '41',
    displayName: 'Novita',
    description: {
      'en-US':
        'Novita AI is an all-in-one AI cloud solution that empowers businesses with open-source model APIs, serverless GPUs, and on-demand GPU instances. Drive innovation and gain a competitive edge with the power of Novita AI.',
      'zh-CN': 'Novita AI 是一家一体化的 AI 云解决方案提供商，为企业和开发者提供开源模型 API、无服务器 GPU 和按需 GPU 实例。通过 Novita AI 的力量推动创新并获得竞争优势。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/novita.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '40',
    displayName: {
      'zh-CN': '字节跳动豆包',
      'en-US': 'ByteDance Doubao',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/doubao.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      {
        displayName: {
          'zh-CN': '模型列表',
          'en-US': 'Model List',
        },
        description: {
          'zh-CN': '对于豆包而言，需要手动去「模型推理页面」创建推理接入点，以接入点名称作为模型名称，例如：ep-20240608051426-tkxvl',
          'en-US':
            'For Doubao, you need to manually go to the "Model Inference Page" to create an inference access point, and use the access point name as the model name, for example: ep-20240608051426-tkxvl',
        },
        name: 'models',
        type: 'string',
        required: true,
        default: [],
        typeOptions: {
          assetType: 'oneapi-model',
          multipleValues: true,
        },
      },
      {
        displayName: 'Base URL',
        name: 'base_url',
        type: 'string',
        required: false,
        description: {
          'zh-CN': '可选，不填默认使用官方的默认地址，如 https://domain.com',
          'en-US': 'Optional, if not filled in, the official default address will be used by default, such as https://domain.com',
        },
        typeOptions: {
          foldUp: true,
        },
      },
      ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
    ],
    description: {
      'zh-CN': '字节跳动推出的自研大模型。通过字节跳动内部50+业务场景实践验证，每日千亿级 tokens 大使用量持续打磨，提供多模态能力，以优质模型效果为企业打造丰富的业务体验。',
      'en-US':
        'Doubao is a self-developed large model launched by ByteDance. It has been verified through 50+ business scenarios within ByteDance, with a daily usage of over 100 billion tokens, continuously polishing with high-quality model effects to provide rich business experiences for enterprises.',
    },
  },
  {
    id: '15',
    displayName: {
      'en-US': 'Baidu WenXinQianFan',
      'zh-CN': '百度文心千帆',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/baidu.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        placeholder: 'APIKey|SecretKey',
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES.slice(1),
    ],
    description: {
      'zh-CN': '百度智能云千帆AppBuilder. 分钟级超低门槛AI原生应用搭建 ; BML全功能AI开发平台. 基于文心大模型完成一站式AI开发',
      'en-US':
        'Baidu Intelligent Cloud Qianfan AppBuilder. Build AI native applications with ultra-low thresholds in minutes; BML full-featured AI development platform. One-stop AI development based on Wenxin large model',
    },
  },
  {
    id: '17',
    displayName: {
      'zh-CN': '阿里通义千问',
      'en-US': 'Alibaba TongYiQianWen',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/qianwen.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '插件参数',
          'en-US': 'Plugin Parameters',
        },
        name: 'other',
        placeholder: '请输入插件参数，即 X-DashScope-Plugin 请求头的取值',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '插件参数，即 X-DashScope-Plugin 请求头的取值',
          'en-US': 'Plugin parameters, that is, the value of the X-DashScope-Plugin request header',
        },
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    ],
    description: {
      'zh-CN': '通义千问（英语：Tongyi Qianwen）是由阿里巴巴集团旗下的云端运算服务的科技公司阿里云开发的聊天机器人，能够与人交互、回答问题及协作创作。',
      'en-US':
        "Tongyi Qianwen is a chatbot developed by Alibaba Cloud, a technology company of Alibaba Group's cloud computing services, which can interact with people, answer questions, and collaborate on creation.",
    },
  },
  {
    id: '18',
    displayName: {
      'zh-CN': '讯飞星火认知',
      'en-US': 'Xunfei Xinhuo',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/xunfei.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        placeholder: 'APPID|APISecret|APIKey',
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      {
        displayName: {
          'zh-CN': '模型版本',
          'en-US': 'Model Version',
        },
        name: 'other',
        placeholder: '请输入星火大模型版本，注意是接口地址中的版本号，例如：v2.1',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '星火大模型版本，注意是接口地址中的版本号，例如：v2.1',
          'en-US': 'model version, note that it is the version number in the interface address, for example: v2.1',
        },
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES.slice(1),
    ],
    description: {
      'zh-CN': '讯飞星火大模型，是由科大讯飞推出的新一代认知智能大模型，拥有跨领域的知识和语言理解能力，能够基于自然对话方式理解与执行任务，提供语言理解、知识问答、逻辑',
      'en-US':
        'Xunfei Xinhuo large model, is a new generation of cognitive intelligent large model launched by iFLYTEK, with cross-domain knowledge and language understanding capabilities, can understand and execute tasks based on natural dialogue, provide language understanding, knowledge Q&A, logic',
    },
  },
  {
    id: '16',
    displayName: {
      'zh-CN': '智谱 ChatGLM',
      'en-US': 'Zhipu ChatGLM',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/zhipuqingyan.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '基于GLM模型开发，支持多轮对话，具备内容创作、信息归纳总结等能力. APP下载. 立即体验. 联系我们. chatglm@zhipuai.cn. 公众号. 企业合作. 大模型. ChatGLM-6B.',
      'en-US': 'Developed based on the GLM model, it supports multi-round dialogue and has the ability to create content, summarize information, etc. APP download. Experience immediately.',
    },
  },
  {
    displayName: {
      'zh-CN': '360 智脑',
      'en-US': '360 ZhiNao',
    },
    id: '19',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/360.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '以人为本，安全可信 · 360智脑. 新一代有形象、有灵魂、有智慧的智脑大模型驱动数字人，帮您查找资料、分析总结、答疑解惑，与您伴读交流，共同成长，是您的知识学习和决策',
      'en-US':
        'People-oriented, safe and trustworthy · 360 ZhiNao. The new generation of tangible, soulful, and intelligent ZhiNao large model drives digital people, helps you find information, analyze and summarize, answer questions, and communicate with you, grow together, and is your knowledge learning and decision-making',
    },
  },
  {
    id: '25',
    displayName: 'Moonshot AI',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/kimi.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US': "Moonshot AI's tool can increase conversion rates, significantly elevate average order value, decrease abandoned carts, and make any store a real money-maker.",
      'zh-CN': 'Moonshot AI 的工具可以提高转化率，显著提高平均订单价值，减少购物车遗弃率，并使任何商店成为真正的赚钱机器。',
    },
  },
  {
    id: '23',
    displayName: {
      'zh-CN': '腾讯混元',
      'en-US': 'Tencent HunYun',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/hunyuan.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        placeholder: 'AppId|SecretId|SecretKey',
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES.slice(1),
    ],
    description: {
      'zh-CN': '腾讯混元大模型是由腾讯研发的大语言模型，具备跨领域知识和自然语言理解能力，实现基于人机自然语言对话的方式，理解用户指令并执行任务，帮助用户实现人获取信息。',
      'en-US':
        'Tencent HunYun large model is a large language model developed by Tencent, with cross-domain knowledge and natural language understanding capabilities, realizing natural language dialogue between humans and machines, understanding user instructions and executing tasks, helping users to obtain information, ...',
    },
  },
  {
    id: '26',
    displayName: {
      'zh-CN': '百川大模型',
      'en-US': 'BaiChuan',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/baichuan.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '百川智能以帮助大众轻松、普惠地获取世界知识和专业服务为使命，致力于通过语言AI的突破，构建中国最优秀的大模型底座。百川大模型，融合了意图理解、信息检索以及强化 ...',
      'en-US':
        "Baichuan Intelligence is committed to helping the public easily and universally obtain world knowledge and professional services. It is committed to building China's best large model base through the breakthrough of language AI. Baichuan large model integrates intent understanding, information retrieval, and reinforcement ...",
    },
  },
  {
    id: '27',
    displayName: 'MiniMax',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/minimax.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN':
        'MiniMax 是一家通用人工智能科技公司，致力于与用户共创智能。MiniMax 自主研发了不同模态的通用大模型，包括万亿参数的 MoE 文本大模型、语音大模型以及图像大模型。基于不同模态通用大模型，推出生产力产品海螺AI、沉浸式AI平台星野等原生应用。MiniMax 开放平台为企业和开发者提供安全、灵活、可靠的API服务，助力快速搭建AI应用。',
      'en-US':
        'MiniMax is a general artificial intelligence technology company dedicated to creating intelligence with users. MiniMax has independently developed universal large models of different modalities, including trillion-parameter MoE text large models, voice large models, and image large models. Based on different modal universal large models, productivity products such as Hailuo AI and immersive AI platform Xingye are launched. The MiniMax open platform provides enterprises and developers with secure, flexible, and reliable API services to help quickly build AI applications.',
    },
  },
  {
    id: '29',
    displayName: 'Groq',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/groq.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US':
        'Groq, Inc. is an American artificial intelligence company that builds an AI accelerator application-specific integrated circuit that they call the Language Processing Unit and related hardware to accelerate the inference performance of AI workloads.',
      'zh-CN': 'Groq, Inc. 是一家美国人工智能公司，专门构建一种他们称之为语言处理单元的 AI 加速器应用特定集成电路和相关硬件，以加速 AI 工作负载的推理性能。',
    },
  },
  {
    id: '30',
    displayName: 'Ollama',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/ollama.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '使用大型语言模型快速启动和运行。',
      'en-US': 'Get up and running with large language models.',
    },
  },
  {
    id: '31',
    displayName: {
      'zh-CN': '零一万物',
      'en-US': 'LingYi WanWu',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/01wanwu.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '零一万物致力于成为一家由技术愿景驱动、拥有卓越中国工程底蕴的创新企业，推动以基座大模型为突破的AI 2.0掀起技术、平台到应用多个层面的革命。',
      'en-US':
        'LingYi WanWu is committed to becoming an innovative enterprise driven by technical vision and possessing outstanding Chinese engineering heritage, promoting the revolution of AI 2.0 from technology, platform to application at multiple levels with the large model as the breakthrough.',
    },
  },
  {
    id: '32',
    displayName: {
      'zh-CN': '阶跃星辰',
      'en-US': 'StepFun',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/jieyuexingchen.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN':
        '阶跃星辰于2023年4月成立，以“智能阶跃，十倍每一个人的可能”为使命。阶跃星辰坚定自研超级模型，积极布局算力、数据等关键资源，发挥算法和人才优势，已完成 Step-1 千亿参数语言大模型和 Step-1V 千亿多模态大模型的研发，在图像理解、多轮指令跟随、数学能力、逻辑推理、文本创作等方面性能达到业界领先水平。',
      'en-US':
        'StepFun was founded in April 2023 with the mission of "Intelligent Step, Ten Times the Possibility of Every Person". StepFun resolutely develops its own super model, actively plans and optimizes key resources such as computing power and data, and leverages its algorithm and talent advantages to complete the development of the Step-1 100 billion parameter language large model and the Step-1V 100 billion multimodal large model, achieving industry-leading performance in image understanding, multi-round instruction following, mathematical ability, logical reasoning, and text creation.',
    },
  },
  {
    id: '34',
    displayName: {
      'zh-CN': '扣子 Coze',
      'en-US': 'Coze',
    },
    description: {
      'en-US':
        'Coze is a next-generation AI application and chatbot developing platform for everyone. Regardless of your programming experience, Coze enables you to effortlessly create various chatbots and deploy them across different social platforms and messaging apps.',
      'zh-CN': '扣子 Coze 是一个面向所有人的下一代 AI 应用和聊天机器人开发平台。无论您是否有编程经验，Coze 都让您可以轻松创建各种聊天机器人，并将其部署到不同的社交平台和消息应用中。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/coze.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '模型列表',
          'en-US': 'Model List',
        },
        description: {
          'zh-CN': '对于 Coze 而言，模型名称即 Bot ID，你可以添加一个前缀 `bot-`，例如：`bot-123456`。',
          'en-US': 'For Coze, the model name is the Bot ID, you can add a prefix `bot-`, for example: `bot-123456`.',
        },
        name: 'models',
        type: 'string',
        required: true,
        default: [],
        typeOptions: {
          assetType: 'oneapi-model',
          multipleValues: true,
        },
      },
      {
        displayName: 'User ID',
        name: 'user_id',
        type: 'string',
        required: true,
        placeholder: '生成该密钥的用户 ID',
        description: {
          'zh-CN': '生成该密钥的用户 ID',
          'en-US': 'The user ID that generated this key',
        },
      },
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      {
        displayName: 'Base URL',
        name: 'base_url',
        type: 'string',
        required: false,
        description: {
          'zh-CN': '可选，不填默认使用官方的默认地址，如 https://domain.com',
          'en-US': 'Optional, if not filled in, the official default address will be used by default, such as https://domain.com',
        },
        typeOptions: {
          foldUp: true,
        },
      },
      ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
    ],
  },
  {
    id: '35',
    displayName: {
      'zh-CN': 'Cohere',
      'en-US': 'Cohere',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/cohere.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US': 'Cohere provides industry-leading large language models (LLMs) and RAG capabilities tailored to meet the needs of enterprise use cases that solve real-world problems.',
      'zh-CN': 'Cohere 提供行业领先的大型语言模型 (LLMs) 和 RAG 能力，以满足解决现实世界问题的企业用例的需求。',
    },
  },
  {
    id: '36',
    displayName: {
      'zh-CN': '深度求索 DeepSeek',
      'en-US': 'DeepSeek',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/deepseek.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US': 'DeepSeek, unravel the mystery of AGI with curiosity. Answer the essential question with long-termism.',
      'zh-CN': '深度求索，以好奇心解开 AGI 的神秘面纱，以长期主义回答根本问题。',
    },
  },
  {
    id: '37',
    displayName: {
      'zh-CN': 'Cloudflare',
      'en-US': 'Cloudflare',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/cloudflare.webp',
    properites: [
      {
        displayName: 'Account ID',
        name: 'user_id',
        type: 'string',
        required: true,
        placeholder: '请输入 Account ID，例如：d8d7c61dbc244c32d3ced280e4bf42b4',
        description: {
          'zh-CN': 'Account ID，例如：d8d7c61dbc244c32d3ced280e4bf42b4',
          'en-US': 'Account ID, for example: d8d7c61dbc244c32d3ced280e4bf42b4',
        },
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    ],
    description: {
      'en-US': 'Run fast, low-latency inference tasks on pre-trained machine learning models natively on Cloudflare Workers.',
      'zh-CN': '在 Cloudflare Workers 上原生运行预训练机器学习模型的快速、低延迟推理任务。',
    },
  },
  {
    id: '38',
    displayName: {
      'zh-CN': 'DeepL',
      'en-US': 'DeepL',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/deepl.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'en-US': 'DeepL Write is a tool that helps you perfect your writing. Write clearly, precisely, with ease, and without errors.',
      'zh-CN': 'DeepL Write 是一个帮助您完善写作的工具。清晰、准确、轻松地写作，没有错误。',
    },
  },
  {
    id: '39',
    displayName: 'together.ai',
    description: {
      'en-US': 'Build gen AI models with Together AI. Benefit from the fastest and most cost-efficient tools and infra. Collaborate with our expert AI team that’s dedicated to your success.',
      'zh-CN': '与我们的专家 AI 团队合作，共同构建生成式 AI 模型。利用最快的工具和基础设施，从我们的 AI 专家那里获得帮助，以实现您的成功。',
    },
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/together_ai.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '42',
    displayName: 'VertexAI',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/vertexai.webp',
    properites: [
      {
        name: 'region',
        displayName: 'Region',
        type: 'string',
        required: true,
        placeholder: 'Vertex AI Region.g. us-east5',
        description: {
          'zh-CN': 'Vertex AI 区域，例如：us-east5',
          'en-US': 'Vertex AI Region.g. us-east5',
        },
      },
      {
        name: 'vertex_ai_project_id',
        displayName: 'Project ID',
        type: 'string',
        required: true,
        placeholder: 'Vertex AI Project ID',
        description: 'Vertex AI Project ID',
      },
      {
        name: 'vertex_ai_adc',
        displayName: 'Google Cloud Application Default Credentials JSON',
        type: 'string',
        required: true,
        placeholder: 'Google Cloud Application Default Credentials JSON',
        description: 'Google Cloud Application Default Credentials JSON',
      },
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES.slice(1),
    ],
    description: {
      'en-US':
        'Vertex AI is a machine learning (ML) platform that lets you train and deploy ML models and AI applications, and customize large language models (LLMs) for use in your AI-powered applications. Vertex AI combines data engineering, data science, and ML engineering workflows, enabling your teams to collaborate using a common toolset and scale your applications using the benefits of Google Cloud.',
      'zh-CN':
        'Vertex AI 是一个机器学习 (ML) 平台，可让您训练和部署机器学习模型和 AI 应用，以及自定义大型语言模型 (LLM)，以在 AI 驱动的应用中使用。Vertex AI 结合了数据工程、数据科学和机器学习工程工作流，使您的团队能够使用通用工具集进行协作，并利用 Google Cloud 的优势扩缩您的应用。',
    },
  },
  {
    id: '43',
    displayName: 'Proxy',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/openai.webp',
    properites: [
      {
        displayName: {
          'zh-CN': '密钥',
          'en-US': 'Key',
        },
        name: 'key',
        type: 'string',
        required: true,
        description: {
          'zh-CN': '在此处填写模型供应商提供的 APIKEY',
          'en-US': 'Enter the APIKEY provided by the model supplier here',
        },
      },
      {
        displayName: 'Base URL',
        name: 'base_url',
        type: 'string',
        required: false,
        description: {
          'zh-CN': '可选，不填默认使用官方的默认地址，如 https://domain.com',
          'en-US': 'Optional, if not filled in, the official default address will be used by default, such as https://domain.com',
        },
      },
      ...COMMON_DEFAULT_CHANNEL_PROPERITIES,
    ],
    description: {
      'zh-CN': 'OpenAI 标准接口代理',
      'en-US': 'OpenAI Standard Interface Proxy',
    },
  },
  {
    id: '44',
    displayName: 'SiliconFlow',
    iconUrl: 'https://monkeyminio01.daocloud.cn/monkeys/icons/siliconflow.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '硅基流动致力于打造规模化、标准化、高效能 AI Infra 平台，提供高效能、低成本的多品类AI 模型服务，助力开发者和企业聚焦产品创新。',
      'en-US': 'SiliconFlow is a platform that provides a comprehensive set of tools and resources for building and deploying AI applications.',
    },
  },
];

export const CHANNEL_OPTIONS = [
  { key: 1, text: 'OpenAI', displayName: { 'zh-CN': 'OpenAI', 'en-US': 'OpenAI' }, value: 1, color: 'green' },
  { key: 3, text: 'Azure OpenAI', displayName: { 'zh-CN': 'Azure OpenAI', 'en-US': 'Azure OpenAI' }, value: 3, color: 'olive' },
  { key: 14, text: 'Anthropic Claude', displayName: { 'zh-CN': 'Anthropic Claude', 'en-US': 'Anthropic Claude' }, value: 14, color: 'black' },
  { key: 33, text: 'AWS', displayName: { 'zh-CN': 'AWS', 'en-US': 'AWS' }, value: 33, color: 'black' },
  { key: 11, text: 'Google PaLM2', displayName: { 'zh-CN': 'Google PaLM2', 'en-US': 'Google PaLM2' }, value: 11, color: 'orange' },
  { key: 24, text: 'Google Gemini', displayName: { 'zh-CN': 'Google Gemini', 'en-US': 'Google Gemini' }, value: 24, color: 'orange' },
  { key: 28, text: 'Mistral AI', displayName: { 'zh-CN': 'Mistral AI', 'en-US': 'Mistral AI' }, value: 28, color: 'orange' },
  { key: 41, text: 'Novita', displayName: { 'zh-CN': 'Novita', 'en-US': 'Novita' }, value: 41, color: 'purple' },
  { key: 40, text: '字节跳动豆包', displayName: { 'zh-CN': '字节跳动豆包', 'en-US': 'ByteDance Doubao' }, value: 40, color: 'blue' },
  { key: 15, text: '百度文心千帆', displayName: { 'zh-CN': '百度文心千帆', 'en-US': 'Baidu Qianfan' }, value: 15, color: 'blue' },
  { key: 17, text: '阿里通义千问', displayName: { 'zh-CN': '阿里通义千问', 'en-US': 'Tongyi Qwen' }, value: 17, color: 'orange' },
  { key: 18, text: '讯飞星火认知', displayName: { 'zh-CN': '讯飞星火认知', 'en-US': 'XunFei XingHuo' }, value: 18, color: 'blue' },
  { key: 16, text: '智谱 ChatGLM', displayName: { 'zh-CN': '智谱 ChatGLM', 'en-US': 'ZhiPuAI ChatGLM' }, value: 16, color: 'violet' },
  { key: 19, text: '360 智脑', displayName: { 'zh-CN': '360 智脑', 'en-US': '360 AI' }, value: 19, color: 'blue' },
  { key: 25, text: 'Moonshot AI', displayName: { 'zh-CN': 'Moonshot AI', 'en-US': 'Moonshot AI' }, value: 25, color: 'black' },
  { key: 23, text: '腾讯混元', displayName: { 'zh-CN': '腾讯混元', 'en-US': 'Tencent HunYuan' }, value: 23, color: 'teal' },
  { key: 26, text: '百川大模型', displayName: { 'zh-CN': '百川大模型', 'en-US': 'BaiChuan AI' }, value: 26, color: 'orange' },
  { key: 27, text: 'MiniMax', displayName: { 'zh-CN': 'MiniMax', 'en-US': 'MiniMax' }, value: 27, color: 'red' },
  { key: 29, text: 'Groq', displayName: { 'zh-CN': 'Groq', 'en-US': 'Groq' }, value: 29, color: 'orange' },
  { key: 30, text: 'Ollama', displayName: { 'zh-CN': 'Ollama', 'en-US': 'Ollama' }, value: 30, color: 'black' },
  { key: 31, text: '零一万物', displayName: { 'zh-CN': '零一万物', 'en-US': 'LingYiWanWu' }, value: 31, color: 'green' },
  { key: 32, text: '阶跃星辰', displayName: { 'zh-CN': '阶跃星辰', 'en-US': 'StepFun' }, value: 32, color: 'blue' },
  { key: 34, text: 'Coze', displayName: { 'zh-CN': '扣子 Coze', 'en-US': 'Coze' }, value: 34, color: 'blue' },
  { key: 35, text: 'Cohere', displayName: { 'zh-CN': 'Cohere', 'en-US': 'Cohere' }, value: 35, color: 'blue' },
  { key: 36, text: 'DeepSeek', displayName: { 'zh-CN': '深度求索 DeepSeek', 'en-US': 'DeepSeek' }, value: 36, color: 'black' },
  { key: 37, text: 'Cloudflare', displayName: { 'zh-CN': 'Cloudflare', 'en-US': 'Cloudflare' }, value: 37, color: 'orange' },
  { key: 38, text: 'DeepL', displayName: { 'zh-CN': 'DeepL', 'en-US': 'DeepL' }, value: 38, color: 'black' },
  { key: 39, text: 'together.ai', displayName: { 'zh-CN': 'together.ai', 'en-US': 'together.ai' }, value: 39, color: 'blue' },
  { key: 42, text: 'VertexAI', displayName: { 'zh-CN': 'VertexAI', 'en-US': 'VertexAI' }, value: 42, color: 'blue' },
  { key: 43, text: 'Proxy', displayName: { 'zh-CN': 'Proxy', 'en-US': 'Proxy' }, value: 43, color: 'blue' },
  { key: 44, text: 'SiliconFlow', displayName: { 'zh-CN': 'SiliconFlow', 'en-US': 'SiliconFlow' }, value: 44, color: 'blue' },
  { key: 8, text: '自定义渠道', displayName: { 'zh-CN': '自定义渠道', 'en-US': 'Custom Channel' }, value: 8, color: 'pink' },
  { key: 22, text: '知识库：FastGPT', displayName: { 'zh-CN': '知识库：FastGPT', 'en-US': 'Knowledge Base: FastGPT' }, value: 22, color: 'blue' },
  { key: 21, text: '知识库：AI Proxy', displayName: { 'zh-CN': '知识库：AI Proxy', 'en-US': 'Knowledge Base: AI Proxy' }, value: 21, color: 'purple' },
  { key: 20, text: '代理：OpenRouter', displayName: { 'zh-CN': '代理：OpenRouter', 'en-US': 'Proxy: OpenRouter' }, value: 20, color: 'black' },
  { key: 2, text: '代理：API2D', displayName: { 'zh-CN': '代理：API2D', 'en-US': 'Proxy: API2D' }, value: 2, color: 'blue' },
  { key: 5, text: '代理：OpenAI-SB', displayName: { 'zh-CN': '代理：OpenAI-SB', 'en-US': 'Proxy: OpenAI-SB' }, value: 5, color: 'brown' },
  { key: 7, text: '代理：OhMyGPT', displayName: { 'zh-CN': '代理：OhMyGPT', 'en-US': 'Proxy: OhMyGPT' }, value: 7, color: 'purple' },
  { key: 10, text: '代理：AI Proxy', displayName: { 'zh-CN': '代理：AI Proxy', 'en-US': 'Proxy: AI Proxy' }, value: 10, color: 'purple' },
  { key: 4, text: '代理：CloseAI', displayName: { 'zh-CN': '代理：CloseAI', 'en-US': 'Proxy: CloseAI' }, value: 4, color: 'teal' },
  { key: 6, text: '代理：OpenAI Max', displayName: { 'zh-CN': '代理：OpenAI Max', 'en-US': 'Proxy: OpenAI Max' }, value: 6, color: 'violet' },
  { key: 9, text: '代理：AI.LS', displayName: { 'zh-CN': '代理：AI.LS', 'en-US': 'Proxy: AI.LS' }, value: 9, color: 'yellow' },
  { key: 12, text: '代理：API2GPT', displayName: { 'zh-CN': '代理：API2GPT', 'en-US': 'Proxy: API2GPT' }, value: 12, color: 'blue' },
  { key: 13, text: '代理：AIGC2D', displayName: { 'zh-CN': '代理：AIGC2D', 'en-US': 'Proxy: AIGC2D' }, value: 13, color: 'purple' },
];
