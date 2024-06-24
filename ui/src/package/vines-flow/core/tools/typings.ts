import { BlockDefinition, BlockDefPropertyTypes } from '@inf-monkeys/vines';
import { BlockDefProperties } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

export type VinesToolDefProperties = BlockDefProperties & {
  extra?: {
    workflowId?: string;
  };
};

export type VinesToolDef = Omit<BlockDefinition, 'input' | 'output'> & {
  input: VinesToolDefProperties[];
  output: VinesToolDefProperties[];
};

export type VinesToolWithCategory = [VinesToolDef[], number, string, string];

export type VinesWorkflowVariable = Pick<
  BlockDefProperties,
  'name' | 'type' | 'displayName' | 'typeOptions' | 'default' | 'description'
>;

export interface IVinesVariableMap {
  name: string;
  displayName: string;
  type: BlockDefPropertyTypes;
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
  type: BlockDefPropertyTypes;
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
