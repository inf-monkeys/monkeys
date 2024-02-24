import React from 'react';

import { Calculator, FileBox, GalleryVerticalEnd, Rocket, Server, ShoppingCart } from 'lucide-react';

export interface NavItem {
  name: string;
  label: string;
  icon?: React.ReactNode;
  items?: NavItem[];
}

export const SIDEBAR_MAP: NavItem[] = [
  {
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
        name: 'workflow-app',
        label: '工作流',
      },
      {
        name: 'canvas-app',
        label: '无限画板',
      },
    ],
  },
  {
    name: 'tool',
    label: '工具',
    icon: <Calculator />,
    items: [
      {
        name: 'execute-tool',
        label: '执行类工具',
      },
      {
        name: 'interpret-tool',
        label: '渲染类工具',
      },
    ],
  },
  {
    name: 'model',
    label: '模型',
    icon: <FileBox />,
    items: [
      {
        name: 'language-model',
        label: '语言模型',
      },
      {
        name: 'image-model',
        label: '图像模型',
      },
    ],
  },
  {
    name: 'data',
    label: '数据',
    icon: <GalleryVerticalEnd />,
    items: [
      {
        name: 'text-data',
        label: '文本数据',
      },
      {
        name: 'sheet-data',
        label: '表格数据',
      },
      {
        name: 'media-data',
        label: '富媒体数据',
      },
    ],
  },
  {
    name: 'market',
    label: '市场',
    icon: <ShoppingCart />,
    items: [
      {
        name: 'app-market',
        label: '应用市场',
      },
      {
        name: 'tool-market',
        label: '工具市场',
      },
      {
        name: 'model-market',
        label: '模型市场',
      },
      {
        name: 'data-market',
        label: '数据市场',
      },
    ],
  },
];
