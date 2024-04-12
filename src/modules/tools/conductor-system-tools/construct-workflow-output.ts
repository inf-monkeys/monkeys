import defineNode from '@/common/utils/define-tool';
import { BlockType } from '@inf-monkeys/vines';

export default defineNode({
  type: BlockType.SIMPLE,
  name: 'construct_workflow_output',
  categories: ['process'],
  displayName: '组装数据',
  description: '组装数据',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [],
  output: [],
  extra: {
    estimateTime: 3,
  },

  hidden: true,
  handler: async (inputs) => {
    return inputs;
  },
});
