import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export enum HumanMode {
  Array = 'array',
  ArrayJoin = 'array-join',
}

export default defineNode({
  type: ToolType.HUMAN,
  name: 'human',
  categories: ['human'],
  displayName: {
    'zh-CN': '人工交互',
    'en-US': 'Human Interaction',
  },
  description: {
    'zh-CN': '在执行中设置断点，由用户执行手动交互',
    'en-US': 'Set breakpoints in execution for manual interaction by the user',
  },
  icon: 'emoji:👋:#b291f7',
  input: [
    {
      displayName: {
        'zh-CN': '展示内容',
        'en-US': 'Display Content',
      },
      name: 'diplayContent',
      type: 'string',
      required: true,
      default: [],
      typeOptions: {
        multipleValues: true,
      },
    },
    {
      displayName: {
        'zh-CN': '输出结果类型',
        'en-US': 'Output Type',
      },
      name: 'outputType',
      type: 'options',
      required: true,
      default: HumanMode.Array,
      options: [
        {
          name: {
            'zh-CN': '数组',
            'en-US': 'Array',
          },
          value: HumanMode.Array,
        },
        {
          name: {
            'zh-CN': '字符串拼接',
            'en-US': 'String Join By Separator',
          },
          value: HumanMode.ArrayJoin,
        },
      ],
    },
    {
      displayName: {
        'zh-CN': '分隔符',
        'en-US': 'Separator',
      },
      name: 'arrayJoinSeparator',
      type: 'string',
      displayOptions: {
        show: {
          outputType: [HumanMode.ArrayJoin],
        },
      },
    },
  ],
  output: [
    {
      name: 'choose',
      displayName: {
        'zh-CN': '用户选择',
        'en-US': 'User Choice',
      },
      type: 'boolean',
    },
    {
      name: 'selected',
      displayName: {
        'zh-CN': '用户选择的内容',
        'en-US': 'Selected Content',
      },
      type: 'string',
      typeOptions: {
        multipleValues: true,
      },
    },
  ],
});
