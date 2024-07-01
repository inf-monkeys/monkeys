import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.FORK_JOIN,
  name: 'fork_task',
  categories: ['process'],
  displayName: {
    'zh-CN': '并行执行',
    'en-US': 'Fork Join',
  },
  description: {
    'zh-CN': '并行执行',
    'en-US': 'Fork Join',
  },
  icon: 'emoji:🐾:#d1dcfb',
  input: [
    {
      type: 'string',
      displayName: {
        'zh-CN': '需要等待完成的分支名称',
        'en-US': 'Branches to wait for',
      },
      name: 'joinOn',
      typeOptions: {
        multipleValues: true,
      },
      default: ['all'],
      required: true,
      assetType: 'fork-join-branch',
    },
  ],
  output: [],
  credentials: null,
  extra: null,
  rules: null,
});
