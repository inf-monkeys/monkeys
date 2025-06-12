import React from 'react';

import { LinkOptions } from '@tanstack/react-router';

import { Bot, Calculator, Database, Package, PaletteIcon } from 'lucide-react';

export interface NavItemWithoutLabel {
  name: string;
  path?: LinkOptions['to'];
  icon?: React.ReactNode;
  items?: NavItemWithoutLabel[];
  comingSoon?: boolean;
  super?: boolean;
}

export const SIDEBAR_MAP: NavItemWithoutLabel[] = [
  // {
  //   path: '/$teamId/workbench',
  //   name: 'workbench',
  //   icon: <Rocket />,
  // },
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
    name: 'designs',
    icon: <PaletteIcon />,
    items: [
      {
        name: 'designs',
        path: '/$teamId/designs',
      },
      {
        path: '/$teamId/media-data',
        name: 'design-assets',
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
  // {
  //   name: 'store',
  //   icon: <ShoppingCart />,
  //   items: [
  //     {
  //       path: '/$teamId/application-store',
  //       name: 'application-store',
  //     },
  //     // {
  //     //   path: '/$teamId/text-model-store',
  //     //   name: 'text-model-store',
  //     // },
  //     // {
  //     //   path: '/$teamId/image-model-store',
  //     //   name: 'image-model-store',
  //     // },
  //     {
  //       path: '/$teamId/comfyui-store',
  //       name: 'comfyui-store',
  //     },
  //   ],
  // },
];
