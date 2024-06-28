import defineNode from '@/common/utils/define-tool';
import { ToolType } from '@inf-monkeys/monkeys';

export default defineNode({
  type: ToolType.SWITCH,
  name: 'switch',
  icon: 'emoji:🤖️:#7fa3f8',
  categories: ['process'],
  displayName: {
    'zh-CN': '条件分支',
    'en-US': 'Switch',
  },
  description: {
    'zh-CN': '根据输入的逻辑，选择工作流接下来的执行方向',
    'en-US': 'Select the next execution direction of the workflow based on the input logic',
  },
  input: [
    {
      displayName: {
        'zh-CN': '规则类型',
        'en-US': 'Evaluator Type',
      },
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
      displayName: {
        'zh-CN': '表达式',
        'en-US': 'Expression',
      },
      name: 'expression',
      type: 'string',
      required: true,
      default: "$.parameters.example == 'true' ? 'switchTrue' : 'switchFalse'",
      description: {
        'zh-CN': '如果规则类型是 value-param，填写在 inputParameters.parameters 中定义的 key；如果规则类型是 javascript，填写对应的 javascript 规则',
        'en-US': 'If the rule type is value-param, fill in the key defined in inputParameters.parameters; if the rule type is javascript, fill in the corresponding javascript rule',
      },
      example: "$.parameters.example == 'true' ? 'switchTrue' : 'switchFalse'",
    },
    {
      displayName: {
        'zh-CN': '执行参数',
        'en-US': 'Execution Parameters',
      },
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
      displayName: {
        'zh-CN': '分支结果',
        'en-US': 'Branch Result',
      },
      type: 'string',
    },
  ],
});
