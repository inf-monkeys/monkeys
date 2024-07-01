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
  displayName: {
    'zh-CN': '循环',
    'en-US': 'Do-While',
  },
  description: {
    'zh-CN': 'Do-while 循环',
    'en-US': 'Do-while loop',
  },
  icon: 'emoji:🤖️:#7fa3f8',
  input: [
    {
      displayName: {
        'zh-CN': '循环模式',
        'en-US': 'Loop Mode',
      },
      name: 'mode',
      type: 'options',
      default: DoWhileMode.Fixed,
      options: [
        {
          name: {
            'zh-CN': '循环列表模式',
            'en-US': 'List Mode',
          },
          value: DoWhileMode.List,
        },
        {
          name: {
            'zh-CN': '固定次数模式',
            'en-US': 'Fixed Mode',
          },
          value: DoWhileMode.Fixed,
        },

        {
          name: {
            'zh-CN': '表达式模式',
            'en-US': 'Expression Mode',
          },
          value: DoWhileMode.Expression,
        },
      ],
      required: true,
    },
    {
      displayName: {
        'zh-CN': '执行参数',
        'en-US': 'Parameters',
      },
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
      displayName: {
        'zh-CN': '循环表达式',
        'en-US': 'Loop Condition',
      },
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
      displayName: {
        'zh-CN': '需要循环的列表',
        'en-US': 'List to Loop Over',
      },
      description: {
        'zh-CN': '传入的数据必须为列表类型数据，你可以在循环内的节点通过 ${_TaskRefName__loopItemRef.output.result} 来获取当前循环的元素',
        'en-US': 'The input data must be a list type data, you can get the current loop element in the node inside the loop through ${_TaskRefName__loopItemRef.output.result}',
      },
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
      displayName: {
        'zh-CN': '循环次数',
        'en-US': 'Loop Count',
      },
      description: {
        'zh-CN': '输入需要循环的固定次数',
        'en-US': 'Input the fixed number of times to loop',
      },
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
      displayName: {
        'zh-CN': '迭代次数',
        'en-US': 'Iteration Count',
      },
      type: 'number',
    },
  ],
});
