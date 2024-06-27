import { ToolProperty } from '@inf-monkeys/monkeys';

export const MODEL_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '大语言模型',
    'en-US': 'Large Language Model Name',
  },
  name: 'model',
  type: 'string',
  required: true,
  typeOptions: {
    assetType: 'llm-model',
  },
};

export const USER_MESSAGE_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '用户消息',
    'en-US': 'User Message',
  },
  name: 'prompt',
  type: 'string',
  required: false,
};

export const SYSTEM_PROMOT_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '预制 Prompt',
    'en-US': 'System Prompt',
  },
  name: 'systemPrompt',
  type: 'string',
  required: false,
};

export const MAX_TOKEN_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '最大 Token 数',
    'en-US': 'Max Tokens',
  },
  name: 'max_tokens',
  type: 'number',
  required: false,
  description: {
    'zh-CN': '设置最大 Token 数，如果消息 Token 数超过 max_tokens，将会被截断',
    'en-US': 'Set the maximum number of tokens. If the number of tokens in the message exceeds max_tokens, it will be truncated.',
  },
};

export const TEMPERATURE_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': 'temperature（随机性程度）',
    'en-US': 'Temperature',
  },
  name: 'temperature',
  type: 'number',
  default: 0.7,
  required: false,
  description: {
    'zh-CN': '填写 0-1 的浮点数\n用于生成文本时，模型输出的随机性程度。较高的温度会导致更多的随机性，可能产生更有创意的回应。而较低的温度会使模型的输出更加确定，更倾向于选择高概率的词语。',
    'en-US':
      'Fill in the floating point number of 0-1\nUsed to generate text, the randomness of the model output. A higher temperature will lead to more randomness, which may produce more creative responses. A lower temperature will make the model output more certain and tend to choose words with high probability.',
  },
};

export const PRESENCE_PENALTY_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': 'presence_penalty（重复惩罚）',
    'en-US': 'Presence Penalty',
  },
  name: 'presence_penalty',
  type: 'number',
  default: 0.5,
  required: false,
  description: {
    'zh-CN': '填写 0-1 的浮点数\n用于惩罚模型生成重复的词语，从而使生成的文本更加多样化。',
    'en-US': 'Fill in the floating point number of 0-1\nUsed to penalize the model for generating repeated words, making the generated text more diverse.',
  },
};

export const FREQUENCY_PENALTY_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': 'frequency_penalty（频率惩罚）',
    'en-US': 'Frequency Penalty',
  },
  name: 'frequency_penalty',
  type: 'number',
  default: 0.5,
  required: false,
  description: {
    'zh-CN': '填写 0-1 的浮点数\n用于惩罚模型生成低频词语，从而使生成的文本更加多样化。',
    'en-US': 'Fill in the floating point number of 0-1\nUsed to penalize the model for generating low-frequency words, making the generated text more diverse.',
  },
};

export const STREAM_PROPERTY: ToolProperty = {
  name: 'stream',
  displayName: {
    'zh-CN': '是否流式输出',
    'en-US': 'Enable Stream Mode',
  },
  type: 'boolean',
  required: false,
  default: false,
};

export const KNOWLEDGE_BASE_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '知识库上下文',
    'en-US': 'Knowledge Base Context',
  },
  name: 'knowledgeBase',
  type: 'string',
  typeOptions: {
    assetType: 'knowledge-base',
  },
};

export const SQL_KNOWLEDGE_BASE_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': 'SQL 知识库上下文',
    'en-US': 'SQL Knowledge Base Context',
  },
  name: 'sqlKnowledgeBase',
  type: 'string',
  typeOptions: {
    assetType: 'sql-knowledge-base',
  },
};

export const TOOLS_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '工具列表',
    'en-US': 'Tools',
  },
  name: 'tools',
  type: 'string',
  typeOptions: {
    assetType: 'tools',
    multipleValues: true,
  },
};

export const RESPONSE_FORMAT_PROPERTY: ToolProperty = {
  displayName: {
    'zh-CN': '数据响应格式',
    'en-US': 'Response Format',
  },
  name: 'response_format',
  type: 'options',
  default: 'text',
  description: {
    'zh-CN':
      '当设置为 json_object 时，必须在 system 或者 user message 中手动要求大语言模型返回 json 格式数据，详情请见：https://platform.openai.com/docs/api-reference/chat/create#chat-create-response_format',
    'en-US':
      'When set to json_object, you must manually request the large language model to return json format data in the system or user message. For details, please see: https://platform.openai.com/docs/api-reference/chat/create#chat-create-response_format',
  },
  options: [
    {
      name: 'text',
      value: 'text',
    },
    {
      name: 'json_object',
      value: 'json_object',
    },
  ],
};
