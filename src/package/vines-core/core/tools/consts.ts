import { BlockType } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

import { VinesBlockDefProperties, VinesToolDef } from '@/package/vines-core/core/tools/typings.ts';

export const BUILT_IN_TOOLS: VinesToolDef[] = [
  {
    name: 'fake_node',
    displayName: '点击添加节点',
    icon: 'emoji:⛔:#35363b',
    type: 'SIMPLE' as BlockType.SIMPLE,
    categories: ['process'],
    input: [],
    output: [],
  },
];

export const SUB_WORKFLOW_TOOL_CHOOSE_VERSION_PROP = (workflowId: string): VinesBlockDefProperties => ({
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
