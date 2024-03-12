import { BlockType } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

import { VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const BUILT_IN_TOOLS: VinesToolDef[] = [
  {
    name: 'fake_node',
    displayName: '点击添加工具',
    icon: 'emoji:⛔:#35363b',
    type: 'SIMPLE' as BlockType.SIMPLE,
    categories: ['process'],
    input: [],
    output: [],
  },
];

export const SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP = (workflowId: string): VinesToolDefProperties => ({
  name: 'version',
  displayName: '选择工作流版本号',
  type: 'number',
  typeOptions: {
    assetType: 'workflow-version',
  },
  required: true,
  extra: {
    workflowId,
  },
});

export const TOOL_CATEGORY_SORT_INDEX_LIST = [
  'all',
  'block',
  'gen-text',
  'query',
  'text',
  'gen-image',
  'image',
  'file',
  'train-model',
  'db',
  'auto',
  'process',
  'human',
  'extra',
  'bio',
];

export enum TOOL_CATEGORY {
  all = '全部工具',
  process = '流程控制',
  image = '图像处理',
  text = '文本处理',
  file = '文件处理',
  'gen-image' = '图像生成',
  'gen-text' = '文本生成',
  auto = '自动化',
  db = '数据存储',
  query = '搜索增强',
  extra = '扩展能力',
  'train-model' = '模型训练',
  bio = '生命科学',
  human = '用户交互',
}

export const IGNORE_TOOLS = ['fake_node', 'notification_join'];
