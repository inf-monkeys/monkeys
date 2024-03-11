import defineNode from '@/common/utils/define-tool';
import { BlockType } from '@inf-monkeys/vines';

export default defineNode({
  type: BlockType.FORK_JOIN,
  name: 'fork_task',
  categories: ['process'],
  displayName: '并行执行',
  description: '并行执行',
  icon: 'emoji:🐾:#d1dcfb',
  input: [
    {
      type: 'string',
      displayName: '等待分支执行完成',
      name: 'joinOn',
      typeOptions: {
        multipleValues: true,
      },
      default: ['all'],
      required: true,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      assetType: 'fork-join-branch',
    },
  ],
  output: [],
  credentials: null,
  extra: null,
  rules: null,
});
