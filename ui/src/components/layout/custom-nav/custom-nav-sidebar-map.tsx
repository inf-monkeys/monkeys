import { BotIcon } from 'lucide-react';

import { DesignProjectList } from '../main/sidebar/design-project-list';
import { INavListSidebar } from './common-sidebar';

export const CUSTOM_NAV_LIST_MAP: Record<string, INavListSidebar> = {
  'concept-design:design-templates-and-innovation-approaches': [
    {
      id: 'design-project',
      name: '设计项目',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-templates-and-innovation-approaches/design-project',
    },
    {
      id: 'design-template',
      name: '设计模板',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-templates-and-innovation-approaches/design-template',
    },
    {
      id: 'innovation-method',
      name: '创新方法',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-templates-and-innovation-approaches/innovation-method',
    },
  ],
  'concept-design:design-assets': null,
  'concept-design:design-models': [
    {
      id: 'llm-model',
      name: '语言模型',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-models/llm-model',
    },
    {
      id: 'visual-generation-model',
      name: '视觉生成模型',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-models/visual-generation-model',
    },
  ],
  'concept-design:design-evaluations': [
    {
      id: 'ai-evaluation',
      name: '人工智能测评',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-evaluations/ai-evaluation',
    },
    {
      id: 'vr-evaluation',
      name: '虚拟现实测评',
      icon: <BotIcon />,
      to: '/$teamId/nav/concept-design:design-evaluations/vr-evaluation',
    },
  ],
  designs: DesignProjectList,
  'artist:asset-library': null,
};
