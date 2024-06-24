import { LlmChannelEntity } from '@/database/entities/assets/model/llm-channel/llm-channel.entity';
import { BlockDefProperties } from '@inf-monkeys/vines';

export interface OneAPIChannel {
  key: number;
  text: string;
  value: number;
  color: string;
  icon: string;
  properites: BlockDefProperties[];
}

export const DEFAULT_ONEAPI_CHANNEL_PROPERITIES: BlockDefProperties[] = [
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
    description: '可选，不填默认使用官方的默认地址',
  },
];

export const ONEAPI_CHANNELS: Partial<LlmChannelEntity>[] = [
  {
    id: '1',
    displayName: 'OpenAI',
    description:
      'OpenAI is an American artificial intelligence research organization founded in December 2015, researching artificial intelligence with the goal of developing "safe and beneficial" artificial general intelligence, which it defines as "highly autonomous systems that outperform humans at most economically valuable work.',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/OpenAI.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '14',
    displayName: 'Anthropic Claude',
    description: 'Claude is a family of large language models developed by Anthropic. The first model was released in March 2023. Claude 3, released in March 2024, can also analyze images',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Claude.svg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    displayName: 'Azure OpenAI',
    id: '3',
    description: 'Azure OpenAI offers private networking, regional availability, and responsible AI content filtering',
    iconUrl: 'https://sp-ao.shortpixel.ai/client/to_auto,q_lossy,ret_img,w_869,h_480/https://answerrocket.com/wp-content/uploads/azure-openai-logo-625x345-1.png',
    properites: [
      {
        displayName: 'AZURE_OPENAI_ENDPOINT',
        name: 'azure_base_url',
        description: '请输入 AZURE_OPENAI_ENDPOINT，例如：https://docs-test-001.openai.azure.com',
        type: 'string',
        required: false,
      },
      {
        displayName: '默认 API 版本',
        name: 'azure_other',
        description: '请输入默认 API 版本，例如：2024-03-01-preview，该配置可以被实际的请求查询参数所覆盖',
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
    description: "PaLM 2 is our next generation language model with improved multilingual, reasoning and coding capabilities that builds on Google's legacy of breakthrough ...",
    iconUrl: 'https://static.infmonkeys.com/logo/llm/PaLM2.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
  },
  {
    id: '24',
    displayName: 'Google Gemini',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Gemini.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description:
      "Google Gemini is a family of multimodal large language models developed by Google DeepMind, serving as the successor to LaMDA and PaLM 2. Comprising Gemini Ultra, Gemini Pro, Gemini Flash, and Gemini Nano, it was announced on December 6, 2023, positioned as a competitor to OpenAI's GPT-4",
  },
  {
    id: '28',
    displayName: 'Mistral AI',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/MiniMax.webp',
    properites: [
      ...DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
      {
        type: 'notice',
        displayName:
          '对于豆包而言，需要手动去[模型推理页面](https://console.volcengine.com/ark/region:ark+cn-beijing/endpoint)创建推理接入点，以接入点名称作为模型名称，例如：`ep-20240608051426-tkxvl`。',
        name: 'notice',
      },
    ],
    description:
      'Mistral AI is a French company specializing in artificial intelligence products. Founded in April 2023 by former employees of Meta Platforms and Google DeepMind, the company has quickly risen to prominence in the AI sector.',
  },
  {
    id: '15',
    displayName: '百度文心千帆',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/WenXinQianFan.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '百度智能云千帆AppBuilder. 分钟级超低门槛AI原生应用搭建 ; BML全功能AI开发平台. 基于文心大模型完成一站式AI开发',
  },
  {
    id: '17',
    displayName: '阿里通义千问',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/TongYiQianWen.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '通义千问（英语：Tongyi Qianwen）是由阿里巴巴集团旗下的云端运算服务的科技公司阿里云开发的聊天机器人，能够与人交互、回答问题及协作创作。',
  },
  {
    id: '18',
    displayName: '讯飞星火认知',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/XunfeiXinhuo.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '讯飞星火大模型，是由科大讯飞推出的新一代认知智能大模型，拥有跨领域的知识和语言理解能力，能够基于自然对话方式理解与执行任务，提供语言理解、知识问答、逻辑',
  },
  {
    id: '16',
    displayName: '智谱 ChatGLM',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/ChatGLM.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '基于GLM模型开发，支持多轮对话，具备内容创作、信息归纳总结等能力. APP下载. 立即体验. 联系我们. chatglm@zhipuai.cn. 公众号. 企业合作. 大模型. ChatGLM-6B.',
  },
  {
    displayName: '360 智脑',
    id: '19',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/360ZhiNao.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '以人为本，安全可信 · 360智脑. 新一代有形象、有灵魂、有智慧的智脑大模型驱动数字人，帮您查找资料、分析总结、答疑解惑，与您伴读交流，共同成长，是您的知识学习和决策',
  },
  {
    id: '25',
    displayName: 'Moonshot AI',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Moonshot.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: "“Moonshot AI's tool can increase conversion rates, significantly elevate average order value, decrease abandoned carts, and make any store a real money-maker.”.",
  },
  {
    id: '23',
    displayName: '腾讯混元',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/TengXunHunYun.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '腾讯混元大模型是由腾讯研发的大语言模型，具备跨领域知识和自然语言理解能力，实现基于人机自然语言对话的方式，理解用户指令并执行任务，帮助用户实现人获取信息， ...',
  },
  {
    id: '26',
    displayName: '百川大模型',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/BaiChuan.jpeg',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '百川智能以帮助大众轻松、普惠地获取世界知识和专业服务为使命，致力于通过语言AI的突破，构建中国最优秀的大模型底座。百川大模型，融合了意图理解、信息检索以及强化 ...',
  },
  {
    id: '27',
    displayName: 'MiniMax',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/MiniMax.webp',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description:
      'MiniMax 是一家通用人工智能科技公司，致力于与用户共创智能。MiniMax 自主研发了不同模态的通用大模型，包括万亿参数的 MoE 文本大模型、语音大模型以及图像大模型。基于不同模态通用大模型，推出生产力产品海螺AI、沉浸式AI平台星野等原生应用。MiniMax 开放平台为企业和开发者提供安全、灵活、可靠的API服务，助力快速搭建AI应用。',
  },
  {
    id: '29',
    displayName: 'Groq',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Groq.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description:
      'Groq, Inc. is an American artificial intelligence company that builds an AI accelerator application-specific integrated circuit that they call the Language Processing Unit and related hardware to accelerate the inference performance of AI workloads.',
  },
  {
    id: '30',
    displayName: 'Ollama',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/Ollama.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: 'Get up and running with large language models.',
  },
  {
    id: '31',
    displayName: '零一万物',
    iconUrl: 'https://static.infmonkeys.com/logo/llm/LingYiWanWu.png',
    properites: DEFAULT_ONEAPI_CHANNEL_PROPERITIES,
    description: '零一万物致力于成为一家由技术愿景驱动、拥有卓越中国工程底蕴的创新企业，推动以基座大模型为突破的AI 2.0掀起技术、平台到应用多个层面的革命。',
  },
];
