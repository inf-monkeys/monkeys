import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SUB_WORKFLOW,
  name: 'sub_workflow',
  categories: ['process'],
  displayName: '子流程',
  description: '选择一个已经发布的工作流作为子流程，插入到工作流中',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: '工作流名称',
      name: 'name',
      type: 'string',
      required: true,
      default: '',
    },
    {
      displayName: '工作流版本',
      name: 'version',
      type: 'number',
      required: false,
      default: 1,
    },
    {
      displayName: '工作流执行参数',
      name: 'parameters',
      type: 'json',
      required: false,
      default: '',
      typeOptions: {
        multiFieldObject: true,
      },
    },
  ],
  output: [],
});
