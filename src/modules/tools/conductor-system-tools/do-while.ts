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
  type: ToolType.DO_WHILE,
  name: 'do_while',
  categories: ['process'],
  displayName: '循环',
  description: 'Do-while 循环',
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: '循环模式',
      name: 'mode',
      type: 'options',
      default: DoWhileMode.Fixed,
      options: [
        {
          name: '循环列表模式',
          value: DoWhileMode.List,
        },
        {
          name: '固定次数模式',
          value: DoWhileMode.Fixed,
        },

        {
          name: '表达式模式',
          value: DoWhileMode.Expression,
        },
      ],
      required: true,
    },
    {
      displayName: '执行参数',
      name: 'parameters',
      type: 'json',
      required: false,
      displayOptions: {
        show: {
          mode: [DoWhileMode.Expression],
        },
      },
      typeOptions: {
        multiFieldObject: true,
      },
    },
    {
      displayName: '循环表达式',
      name: 'loopCondition',
      type: 'string',
      required: true,
      example: `if ( ($.LoopTask['iteration'] < $.value ) || ( $.first_task['response']['body'] > 10)) { false; } else { true; }`,
      default: `if ($._TaskRefName_['iteration'] < 1) { false; } else { true; }`,
      displayOptions: {
        show: {
          mode: [DoWhileMode.Expression],
        },
      },
    },
    {
      displayName: '需要循环的列表',
      description: '传入的数据必须为列表类型数据，你可以在循环内的节点通过 ${_TaskRefName__loopItemRef.output.result} 来获取当前循环的元素',
      name: 'listToLoopOver',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          mode: [DoWhileMode.List],
        },
      },
    },
    {
      displayName: '循环次数',
      description: '输入需要循环的固定次数',
      name: 'loopCount',
      type: 'number',
      required: true,
      default: 2,
      displayOptions: {
        show: {
          mode: [DoWhileMode.Fixed],
        },
      },
    },
  ],
  output: [
    {
      name: 'iteration',
      displayName: '迭代次数',
      type: 'number',
    },
  ],
});
