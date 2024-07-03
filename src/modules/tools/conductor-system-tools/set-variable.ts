import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export enum DoWhileMode {
  // 表达式模式，conductor 官方提供的
  // https://conductor.netflix.com/documentation/configuration/workflowdef/operators/do-while-task.html
  Expression = 'expression',
  Fixed = 'fixed',
  List = 'list',
}

export default defineNode({
  type: ToolType.SET_VARIABLE,
  name: 'set_variable',
  categories: ['process'],
  displayName: {
    'zh-CN': '设置变量',
    'en-US': 'Set Variable',
  },
  description: {
    'zh-CN': '设置/更新全局变量，在其他节点中可以通过 ${workflow.variables.NAME} 来引用对应的变量',
    'en-US': 'Set/update global variables, which can be referenced in other nodes through ${workflow.variables.NAME}',
  },
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: {
        'zh-CN': '执行参数',
        'en-US': 'Execution Parameters',
      },
      name: 'parameters',
      type: 'json',
      required: false,
      typeOptions: {
        multiFieldObject: true,
      },
    },
  ],
  output: [],
});
