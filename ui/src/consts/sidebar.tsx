import React from 'react';

import { LinkOptions } from '@tanstack/react-router';

import { Bot, Calculator, Database, Package, Rocket, Server, ShoppingCart } from 'lucide-react';

export interface NavItemWithoutLabel {
  name: string;
  path?: LinkOptions['to'];
  icon?: React.ReactNode;
  items?: NavItemWithoutLabel[];
}

export interface NavItem extends NavItemWithoutLabel {
  label: string;
}

export const SIDEBAR_MAP: NavItemWithoutLabel[] = [
  {
    path: '/$teamId',
    name: 'workbench',
    icon: <Rocket />,
  },
  {
    name: 'agent',
    icon: <Bot />,
  },
  {
    name: 'workflow',
    icon: <Server />,
    path: '/$teamId/workflows',
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
      // {
      //   path: '/$teamId/render-tools',
      //   name: 'render-tools',
      // },
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
