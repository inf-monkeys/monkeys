import React from 'react';

import { LinkOptions } from '@tanstack/react-router';

import { Bot, Calculator, Database, Package, PaletteIcon } from 'lucide-react';

import { VinesSpaceSidebarModule } from '@/apis/common/typings';

export interface NavItemWithoutLabel {
  name: VinesSpaceSidebarModule;
  path?: LinkOptions['to'];
  icon?: React.ReactNode;
  items?: NavItemWithoutLabel[];
  comingSoon?: boolean;
  super?: boolean;
}

export const SIDEBAR_MAP: NavItemWithoutLabel[] = [
  {
    name: 'designs',
    icon: <PaletteIcon />,
    items: [
      {
        path: '/$teamId/media-data',
        name: 'design-assets',
      },
      {
        name: 'design-projects',
        path: '/$teamId/designs',
      },
      {
        name: 'evaluations',
        path: '/$teamId/evaluations',
      },
    ],
  },
  {
    name: 'apps',
    icon: <Bot />,
    items: [
      {
        name: 'agents',
        path: '/$teamId/agents',
      },
      {
        name: 'workflows',
        path: '/$teamId/workflows',
      },
    ],
  },
  {
    name: 'tools',
    icon: <Calculator />,
    path: '/$teamId/tools',
  },
  {
    name: 'model',
    icon: <Package />,
    items: [
      {
        path: '/$teamId/text-models',
        name: 'text-models',
      },
      {
        path: '/$teamId/image-models',
        name: 'image-models',
      },
      {
        path: '/$teamId/model-training',
        name: 'model-training',
      },
      {
        path: '/$teamId/neural-models',
        name: 'neural-models',
      },
    ],
  },
  {
    name: 'media',
    icon: <Database />,
    items: [
      {
        path: '/$teamId/text-data',
        name: 'text-data',
      },
      {
        path: '/$teamId/table-data',
        name: 'table-data',
      },
    ],
  },
];
