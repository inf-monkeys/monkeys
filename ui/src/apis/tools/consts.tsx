import React from 'react';

import { I18nValue } from '@inf-monkeys/monkeys';
import { Hammer, Pickaxe } from 'lucide-react';

export const TOOLS_ROOT_CATEGORIES_MAP: Record<
  string,
  {
    icon: React.ReactNode;
    label: I18nValue;
  }
> = {
  'internal-tools': {
    icon: <Hammer />,
    label: {
      'zh-CN': '预置工具',
      'en-US': 'Internal Tools',
    },
  },
  'external-tools': {
    icon: <Pickaxe />,
    label: {
      'zh-CN': '扩展工具',
      'en-US': 'External Tools',
    },
  },
};

export const EXTERNAL_TOOLS_CATEGORIES_MAP: Record<string, I18nValue> = {
  'sub-workflow': {
    'zh-CN': '子流程',
    'en-US': 'Sub Workflow',
  },
  comfyui: {
    'zh-CN': '外部流程',
    'en-US': 'External Workflow',
  },
  api: {
    'zh-CN': '接口工具',
    'en-US': 'API Tools',
  },
  service: {
    'zh-CN': '服务工具',
    'en-US': 'Service Tools',
  },
};

export const INTERNAL_TOOLS_NAMESPACE = [
  'comfyui',
  'bepipred30_predictor',
  'system',
  'llm',
  'monkey_tools_knowledge_base',
  'midjourney',
  'social_media',
  'monkey_tools_internet',
  'sandbox',
  'monkey_tools_example',
];
