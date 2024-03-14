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
  'name' | 'type' | 'displayName' | 'typeOptions' | 'default'
>;

export interface IVinesVariableMap {
  name: string;
  displayName: string;
  type: BlockDefPropertyTypes;
}

export type VinesVariableMapper = Map<string, IVinesVariableMap>;

export interface IVinesVariable {
  targetId: string;
  id: string;
  jsonpath: string;
  label: string;
  originalName: string;
  type: BlockDefPropertyTypes;
  isMultiple: boolean;
  children?: IVinesVariable[];
}

export interface IVinesVariableTag {
  [key: string]: {
    name: string;
    color: string;
    multipleColor: string;
  };
}
