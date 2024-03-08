import defineNode from '@/common/utils/define-tool';
import { BlockType } from '@inf-monkeys/vines';

export enum HumanMode {
  Array = 'array',
  ArrayJoin = 'array-join',
}

export default defineNode({
  type: BlockType.HUMAN,
  name: 'human',
  categories: ['human'],
  displayName: '选择元素',
  description: '在执行中设置断点，由用户执行手动交互',
  icon: 'emoji:👋:#b291f7',
  input: [
    {
      displayName: '展示内容',
      name: 'diplayContent',
      type: 'string',
      required: true,
      default: [],
      typeOptions: {
        multipleValues: true,
      },
    },
    {
      displayName: '输出结果类型',
      name: 'outputType',
      type: 'options',
      required: true,
      default: HumanMode.Array,
      options: [
        {
          name: '数组',
          value: HumanMode.Array,
        },
        {
          name: '字符串拼接',
          value: HumanMode.ArrayJoin,
        },
      ],
    },
    {
      displayName: '分隔符',
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
      displayName: '用户选择',
      type: 'boolean',
    },
    {
      name: 'selected',
      displayName: '用户选择的元素列表',
      type: 'string',
      typeOptions: {
        multipleValues: true,
      },
    },
  ],
});
