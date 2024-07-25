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
      type: 'notice',
      displayName: {
        'zh-CN': '并行执行的分支全部执行完成之后才会执行后续节点，其中任意分支执行失败会导致整个流程失败。',
        'en-US': 'The subsequent nodes will be executed only after all branches of the parallel execution are completed. If any branch fails, the entire process will fail.',
      },
      name: 'docs',
    },
  ],
  output: [],
  credentials: null,
  extra: null,
  rules: null,
});
