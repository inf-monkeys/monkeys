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

export type VinesVariableMapper = Map<
  string,
  {
    name: string;
    displayName: string;
    type: BlockDefPropertyTypes;
  }
>;

export interface IVinesVariable {
  targetId: string;
  name: string;
  jsonpath: string;
  displayName: string;
  originalName: string;
  type: BlockDefPropertyTypes;
  children?: IVinesVariable[];
}
