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

export const DEFAULT_ONEAPI_CHANNEL_PROPERITIES: ToolProperty[] = [
  {
    displayName: 'API Key',
    name: 'key',
    type: 'string',
    required: true,
    description: 'API Key',
  },
  {
    displayName: 'Base URL',
    name: 'base_url',
    type: 'string',
    required: false,
    description: {
      'zh-CN': '可选，不填默认使用官方的默认地址',
      'en-US': 'Optional, if not filled in, the official default address will be used by default',
    },
  },
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/OpenAI.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '14',
    displayName: 'Anthropic Claude',
    description: {
      'en-US': 'Claude is a family of large language models developed by Anthropic. The first model was released in March 2023. Claude 3, released in March 2024, can also analyze images',
      'zh-CN': 'Claude 是由 Anthropic 开发的大型语言模型系列。第一个模型于 2023 年 3 月发布。2024 年 3 月发布的 Claude 3 还可以分析图像。',
    },
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Claude.svg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    displayName: 'Azure OpenAI',
    id: '3',
    description: {
      'en-US': 'Azure OpenAI offers private networking, regional availability, and responsible AI content filtering',
      'zh-CN': 'Azure OpenAI 提供私有网络、区域可用性和负责任的 AI 内容过滤。',
    },
    iconUrl: 'https://sp-ao.shortpixel.ai/client/to_auto,q_lossy,ret_img,w_869,h_480/https://answerrocket.com/wp-content/uploads/azure-openai-logo-625x345-1.png',
    properites: [
      {
        displayName: 'Azure Base URL',
        name: 'azure_base_url',
        description: {
          'zh-CN': '请输入 AZURE_OPENAI_ENDPOINT，例如：https://docs-test-001.openai.azure.com',
          'en-US': 'Please enter AZURE_OPENAI_ENDPOINT, for example: https://docs-test-001.openai.azure.com',
        },
        type: 'string',
        required: false,
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
      },
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        required: true,
        description: 'API Key',
      },
    ],
  },
  {
    id: '11',
    displayName: 'Google PaLM2',
    description: {
      'en-US': "PaLM 2 is our next generation language model with improved multilingual, reasoning and coding capabilities that builds on Google's legacy of breakthrough ...",
      'zh-CN': 'PaLM 2 是我们的下一代语言模型，具有改进的多语言、推理和编码能力，是基于谷歌突破性的遗产构建的...',
    },
    iconUrl: 'https://static.infmonkeys.com/logo/llm/PaLM2.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '24',
    displayName: 'Google Gemini',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Gemini.png',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/MiniMax.webp',
    properites: [...DEFAULT_ONEAPI_CHANNEL_PROPERITIES],
    description: {
      'en-US':
        'Mistral AI is a French company specializing in artificial intelligence products. Founded in April 2023 by former employees of Meta Platforms and Google DeepMind, the company has quickly risen to prominence in the AI sector.',
      'zh-CN': 'Mistral AI 是一家专门从事人工智能产品的法国公司。该公司成立于 2023 年 4 月，由 Meta Platforms 和 Google DeepMind 的前员工创立，公司迅速在人工智能领域崭露头角。',
    },
  },
  {
    id: '15',
    displayName: {
      'en-US': 'Baidu WenXinQianFan',
      'zh-CN': '百度文心千帆',
    },
    iconUrl: 'https://static.infmonkeys.com/logo/llm/WenXinQianFan.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/TongYiQianWen.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/XunfeiXinhuo.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/ChatGLM.png',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/360ZhiNao.jpeg',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Moonshot.jpeg',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/TengXunHunYun.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/BaiChuan.jpeg',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/MiniMax.webp',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Groq.png',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Ollama.png',
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
    iconUrl: 'https://static.infmonkeys.com/logo/llm/LingYiWanWu.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: {
      'zh-CN': '零一万物致力于成为一家由技术愿景驱动、拥有卓越中国工程底蕴的创新企业，推动以基座大模型为突破的AI 2.0掀起技术、平台到应用多个层面的革命。',
      'en-US':
        'LingYi WanWu is committed to becoming an innovative enterprise driven by technical vision and possessing outstanding Chinese engineering heritage, promoting the revolution of AI 2.0 from technology, platform to application at multiple levels with the large model as the breakthrough.',
    },
  },
];
