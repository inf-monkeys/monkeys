import { I18nValue } from '@inf-monkeys/monkeys';

export type WorkflowListQuery = {
  /** 当前页数，从 1 开始 **/
  page?: number;
  /** 每页数目，默认为 10 **/
  limit?: number;
  /** 搜索关键词 **/
  search?: string;
  /** 排序字段 **/
  orderColumn?: string;
  /** 排序规则 **/
  orderBy?: string;
};

export const ACTION_TOOLS_CATEGORIES_MAP: Record<string, I18nValue> = {
  process: {
    'zh-CN': '流程控制',
    'en-US': 'Process Control',
  },
  image: {
    'zh-CN': '图像处理',
    'en-US': 'Image Process',
  },
  text: {
    'zh-CN': '文本处理',
    'en-US': 'Text Process',
  },
  file: {
    'zh-CN': '文件处理',
    'en-US': 'File Process',
  },
  'gen-image': {
    'zh-CN': '图像生成',
    'en-US': 'Image Generation',
  },
  'gen-text': {
    'zh-CN': '文本生成',
    'en-US': 'Text Generation',
  },
  auto: {
    'zh-CN': '自动化',
    'en-US': 'Automatic',
  },
  db: {
    'zh-CN': '数据存储',
    'en-US': 'Data Storage',
  },
  query: {
    'zh-CN': '搜索增强',
    'en-US': 'Search Enhancement',
  },
  extra: {
    'zh-CN': '扩展能力',
    'en-US': 'Extended Capabilities',
  },
  'train-model': {
    'zh-CN': '模型训练',
    'en-US': 'Model Training',
  },
  bio: {
    'zh-CN': '生命科学',
    'en-US': 'Biological Sciences',
  },
  human: {
    'zh-CN': '用户交互',
    'en-US': 'User Interactions',
  },
};

export interface IVinesWorkflowRateLimiter {
  version?: number;
  enabled?: boolean;
  windowMs?: number;
  max?: number;
}
