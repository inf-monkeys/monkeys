import React from 'react';

import { LinkOptions } from '@tanstack/react-router';

import { Calculator, FileBox, GalleryVerticalEnd, Rocket, Server, ShoppingCart } from 'lucide-react';

export interface NavItem {
  name: string;
  label: string;
  path?: LinkOptions['to'];
  icon?: React.ReactNode;
  items?: NavItem[];
}

export const SIDEBAR_MAP: NavItem[] = [
  {
    path: '/$teamId',
    name: 'workspace',
    label: '工作台',
    icon: <Rocket />,
  },
  {
    name: 'app',
    label: '应用',
    icon: <Server />,
    items: [
      {
        path: '/$teamId/workflows',
        name: 'workflows',
        label: '工作流',
      },
    ],
  },
  {
    name: 'tool',
    label: '工具',
    icon: <Calculator />,
    items: [
      {
        path: '/$teamId/action-tools',
        name: 'action-tools',
        label: '执行类工具',
      },
      // {
      //   path: '/$teamId/render-tools',
      //   name: 'render-tools',
      //   label: '渲染类工具',
      // },
    ],
  },
  {
    name: 'model',
    label: '模型',
    icon: <FileBox />,
    items: [
      {
        path: '/$teamId/text-models',
        name: 'text-models',
        label: '语言模型',
      },
      {
        path: '/$teamId/image-models',
        name: 'image-models',
        label: '图像模型',
      },
    ],
  },
  {
    name: 'media',
    label: '数据',
    icon: <GalleryVerticalEnd />,
    items: [
      {
        path: '/$teamId/text-data',
        name: 'text-data',
        label: '文本数据',
      },
      {
        path: '/$teamId/table-data',
        name: 'table-data',
        label: '表格数据',
      },
      {
        path: '/$teamId/media-data',
        name: 'media-data',
        label: '富媒体数据',
      },
    ],
  },
  {
    name: 'application',
    label: '市场',
    icon: <ShoppingCart />,
    items: [
      {
        path: '/$teamId/application-store',
        name: 'application-store',
        label: '应用市场',
      },
      {
        path: '/$teamId/tool-store',
        name: 'tool-store',
        label: '工具市场',
      },
      {
        path: '/$teamId/text-model-store',
        name: 'text-model-store',
        label: '语言模型市场',
      },
      {
        path: '/$teamId/image-model-store',
        name: 'image-model-store',
        label: '图像模型市场',
      },
      {
        path: '/$teamId/data-store',
        name: 'data-store',
        label: '数据市场',
      },
    ],
  },
];
