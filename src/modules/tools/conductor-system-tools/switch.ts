import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SWITCH,
  name: 'switch',
  icon: 'emoji:🤖️:#7fa3f8',
  categories: ['process'],
  displayName: '选择',
  description: '根据输入的逻辑，选择工作流接下来的执行方向',
  input: [
    {
      displayName: '规则类型',
      name: 'evaluatorType',
      type: 'options',
      required: true,
      default: 'javascript',
      options: [
        {
          name: 'value-param',
          value: 'value-param',
        },
        {
          name: 'javascript',
          value: 'javascript',
        },
      ],
    },
    {
      displayName: '表达式',
      name: 'expression',
      type: 'string',
      required: true,
      default: "$.parameters.example == 'true' ? 'switchTrue' : 'switchFalse'",
      description: '如果规则类型是 value-param，填写在 inputParameters.parameters 中定义的 key；如果规则类型是 javascript，填写对应的 javascript 规则',
      example: "$.parameters.example == 'true' ? 'switchTrue' : 'switchFalse'",
    },
    {
      displayName: '执行参数',
      name: 'parameters',
      type: 'json',
      required: false,
      default: {
        example: 'switchTrue',
      },
      typeOptions: {
        multiFieldObject: true,
      },
    },
  ],
  output: [
    {
      name: 'evaluationResult',
      displayName: '分支结果',
      type: 'string',
    },
  ],
});
