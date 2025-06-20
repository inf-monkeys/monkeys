import { ToolType } from '@inf-monkeys/monkeys';

import { EXTERNAL_TOOLS_CATEGORIES_MAP } from '@/apis/tools/consts.tsx';
import { ACTION_TOOLS_CATEGORIES_MAP } from '@/apis/workflow/typings.ts';
import { IVinesVariableTag, VinesToolDef, VinesToolDefProperties } from '@/package/vines-flow/core/tools/typings.ts';

export const BUILT_IN_TOOLS: VinesToolDef[] = [
  {
    name: 'fake_node',
    // displayName: '点击添加工具',
    displayName: {
      'en-US': 'Click to add tool',
      'zh-CN': '点击添加工具',
    },
    icon: 'emoji:⛔:#35363b',
    type: 'SIMPLE' as ToolType.SIMPLE,
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
  ...Object.keys(EXTERNAL_TOOLS_CATEGORIES_MAP),
  ...Object.keys(ACTION_TOOLS_CATEGORIES_MAP),
  'unknown',
];

export enum TOOL_CATEGORY {
  all = 'all',
  process = 'process',
  image = 'image',
  text = 'text',
  file = 'file',
  'gen-image' = 'gen-image',
  'gen-text' = 'gen-text',
  auto = 'auto',
  db = 'db',
  query = 'query',
  extra = 'extra',
  'train-model' = 'train-model',
  bio = 'bio',
  human = 'human',
}

export const IGNORE_TOOLS = ['fake_node', 'notification_join'];

export const VINES_VARIABLE_TAG: IVinesVariableTag = {
  string: {
    name: 'string',
    color: '#97cc60',
    multipleColor: '#7fa853',
  },
  file: {
    name: 'file',
    color: '#6facf5',
    multipleColor: '#5792d4',
  },
  number: {
    name: 'number',
    color: '#f4e05d',
    multipleColor: '#c8bb53',
  },
  boolean: {
    name: 'boolean',
    color: '#4a68e1',
    multipleColor: '#3951ab',
  },
  options: {
    name: 'options',
    color: '#8e56da',
    multipleColor: '#833ee0',
  },
  json: {
    name: 'json',
    color: '#e28352',
    multipleColor: '#d16e3e',
  },
  qrcode: {
    name: 'qrcode',
    color: '#e28352',
    multipleColor: '#d16e3e',
  },
};
