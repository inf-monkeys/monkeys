import defineNode from '@/common/utils/define-tool';
import { BlockType } from '@inf-monkeys/vines';

export enum DoWhileMode {
  // 表达式模式，conductor 官方提供的
  // https://conductor.netflix.com/documentation/configuration/workflowdef/operators/do-while-task.html
  Expression = 'expression',
  Fixed = 'fixed',
  List = 'list',
}

export default defineNode({
  type: BlockType.SET_VARIABLE,
  name: 'set_variable',
  categories: ['process'],
  displayName: '设置变量',
  description: '设置/更新全局变量，在其他节点中可以通过 ${workflow.variables.NAME} 来引用对应的变量',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: '执行参数',
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
