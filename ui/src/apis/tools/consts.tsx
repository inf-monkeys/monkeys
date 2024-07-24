import { I18nValue } from '@inf-monkeys/monkeys';
import { Hammer, Pickaxe } from 'lucide-react';

export const TOOLS_ROOT_CATEGORIES_MAP: Record<
  string,
  {
    icon: React.ReactNode;
    label: I18nValue;
  }
> = {
  'action-tools': {
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
  'comfyui-workflow': {
    'zh-CN': 'ComfyUI 工作流',
    'en-US': 'ComfyUI Workflow',
  },
};
