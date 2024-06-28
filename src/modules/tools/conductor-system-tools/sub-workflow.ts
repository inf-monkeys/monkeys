import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SUB_WORKFLOW,
  name: 'sub_workflow',
  categories: ['process'],
  displayName: {
    'zh-CN': '子流程',
    'en-US': 'Sub Workflow',
  },
  description: {
    'zh-CN': '选择一个已经发布的工作流作为子流程，插入到工作流中',
    'en-US': 'Select a published workflow as a sub-workflow and insert it into the workflow',
  },
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: {
        'zh-CN': '工作流名称',
        'en-US': 'Workflow Name',
      },
      name: 'name',
      type: 'string',
      required: true,
      default: '',
    },
    {
      displayName: {
        'zh-CN': '工作流版本',
        'en-US': 'Workflow Version',
      },
      name: 'version',
      type: 'number',
      required: false,
      default: 1,
    },
    {
      displayName: {
        'zh-CN': '执行参数',
        'en-US': 'Execution Parameters',
      },
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
