import { BlockDefinition } from '@inf-monkeys/vines';
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

export type VinesVariable = Pick<BlockDefProperties, 'name' | 'type' | 'displayName' | 'typeOptions' | 'default'>;
