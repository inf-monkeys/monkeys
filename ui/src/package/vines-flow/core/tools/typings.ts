import { ToolCategory, ToolDef, ToolProperty, ToolPropertyTypes } from '@inf-monkeys/monkeys';

export type VinesToolDefProperties = ToolProperty & {
  extra?: {
    workflowId?: string;
  };
};

export type VinesToolDef = Omit<ToolDef, 'input' | 'output' | 'categories'> & {
  input: VinesToolDefProperties[];
  output: VinesToolDefProperties[];
  namespace?: string;
  categories?: (ToolCategory | 'api' | 'comfyui' | 'service' | 'unknown')[];
};

export type VinesToolWithCategory = [VinesToolDef[], number, string, string];

export type VinesWorkflowVariable = Pick<
  ToolProperty,
  'name' | 'type' | 'displayName' | 'typeOptions' | 'default' | 'description'
>;

export interface IVinesVariableMap {
  name: string;
  displayName: string;
  type: ToolPropertyTypes;
}

export type VinesVariableMapper = Map<string, IVinesVariableMap>;

export interface IVinesVariableGroupInfo {
  id: string;
  name: string; // 组名
  desc: string; // 组描述
  icon: string; // 组图标
}

export interface IVinesVariable {
  targetId: string;
  id: string;
  jsonpath: string;
  label: string;
  pathLabel?: string;
  originalName: string;
  type: ToolPropertyTypes;
  isMultiple: boolean;
  group: IVinesVariableGroupInfo;
  children?: IVinesVariable[];
}

export interface IVinesVariableTag {
  [key: string]: {
    name: string;
    color: string;
    multipleColor: string;
  };
}

export type JSONValue = null | string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

export interface IVinesToolPropertiesOption {
  name: string;
  value: JSONValue;
}
