import React from 'react';

import { LinkOptions } from '@tanstack/react-router';

import { Calculator, Database, Package, Rocket, Server, ShoppingCart } from 'lucide-react';

export interface NavItemWithoutLabel {
  name: string;
  path?: LinkOptions['to'];
  icon?: React.ReactNode;
  items?: NavItemWithoutLabel[];
  comingSoon?: boolean;
  super?: boolean;
}

export interface NavItem extends NavItemWithoutLabel {
  label: string;
}

export const SIDEBAR_MAP: NavItemWithoutLabel[] = [
  // {
  //   name: 'agent',
  //   icon: <Bot />,
  //   path: '/$teamId/agents',
  //   super: true,
  //   comingSoon: true,
  // },
  {
    path: '/$teamId',
    name: 'workbench',
    icon: <Rocket />,
  },
  {
    name: 'workflow',
    icon: <Server />,
    path: '/$teamId/workflows',
  },
  {
    name: 'tools',
    icon: <Calculator />,
    path: '/$teamId/tools',
  },
  {
    name: 'tool',
    icon: <Calculator />,
    items: [
      {
        path: '/$teamId/action-tools',
        name: 'action-tools',
      },
      {
        path: '/$teamId/comfyui',
        name: 'comfyui',
      },
    ],
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
      {
        path: '/$teamId/media-data',
        name: 'media-data',
      },
    ],
  },
  {
    name: 'store',
    icon: <ShoppingCart />,
    items: [
      {
        path: '/$teamId/application-store',
        name: 'application-store',
      },
      {
        path: '/$teamId/text-model-store',
        name: 'text-model-store',
      },
      {
        path: '/$teamId/image-model-store',
        name: 'image-model-store',
      },
      {
        path: '/$teamId/comfyui-store',
        name: 'comfyui-store',
      },
    ],
  },
];
