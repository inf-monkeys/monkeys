import { get } from 'lodash';

interface IWorkflowInputTypeOption {
  value: string;
  label: string;
  multipleValues?: boolean;
  assetType?: string;
}

export const WORKFLOW_INPUT_TYPE_OPTION_LIST: IWorkflowInputTypeOption[] = [
  {
    value: 'string',
    label: '文本',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'string',
    label: '文本列表',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'number',
    label: '数字',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'number',
    label: '数字列表',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'boolean',
    label: '逻辑值',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'boolean',
    label: '逻辑值列表',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'file',
    label: '文件',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'file',
    label: '文件列表',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'string',
    label: '工作流',
    multipleValues: false,
    assetType: 'workflow',
  },
  {
    value: 'string',
    label: '工作流列表',
    multipleValues: true,
    assetType: 'workflow',
  },
];

export const VINES_WORKFLOW_INPUT_TYPE_DISPLAY_MAPPER = WORKFLOW_INPUT_TYPE_OPTION_LIST.reduce(
  (acc: Record<string, string>, obj) => {
    const assetType = get(obj, 'assetType', '');
    const multipleValues = get(obj, 'multipleValues', false);
    acc[`${obj.value}${assetType ? `:${assetType}` : ''}${multipleValues ? '-list' : ''}`] = obj.label;
    return acc;
  },
  {},
);
