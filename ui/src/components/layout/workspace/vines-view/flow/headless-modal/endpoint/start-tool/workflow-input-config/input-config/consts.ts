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
    label: 'string',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'string',
    label: 'string',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'number',
    label: 'number',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'number',
    label: 'number',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'boolean',
    label: 'boolean',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'boolean',
    label: 'boolean',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'file',
    label: 'file',
    multipleValues: false,
    assetType: '',
  },
  {
    value: 'file',
    label: 'file',
    multipleValues: true,
    assetType: '',
  },
  {
    value: 'string',
    label: 'workflow',
    multipleValues: false,
    assetType: 'workflow',
  },
  {
    value: 'string',
    label: 'workflow',
    multipleValues: true,
    assetType: 'workflow',
  },
  {
    value: 'string',
    label: 'comfyui-model',
    multipleValues: false,
    assetType: 'comfyui-model',
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
