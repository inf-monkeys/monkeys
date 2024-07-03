import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SIMPLE,
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
