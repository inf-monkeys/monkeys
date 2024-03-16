const TYPE_OPTION_LIST = [
  {
    value: 'string',
    label: '文本',
  },
  {
    value: 'string-list',
    label: '文本列表',
  },
  {
    value: 'number',
    label: '数字',
  },
  {
    value: 'number-list',
    label: '数字列表',
  },
  {
    value: 'boolean',
    label: '逻辑值',
  },
  {
    value: 'boolean-list',
    label: '逻辑值列表',
  },
  {
    value: 'file',
    label: '文件',
  },
  {
    value: 'file-list',
    label: '文件列表',
  },
  {
    value: 'string:workflow',
    label: '工作流',
  },
  {
    value: 'string:workflow-list',
    label: '工作流列表',
  },
];

export const VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER = TYPE_OPTION_LIST.reduce((acc: Record<string, string>, obj) => {
  acc[obj.value] = obj.label;
  return acc;
}, {});
