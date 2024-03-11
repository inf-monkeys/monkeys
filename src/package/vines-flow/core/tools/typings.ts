import { BlockDefinition } from '@inf-monkeys/vines';
import { BlockDefProperties } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

export type VinesBlockDefProperties = BlockDefProperties & {
  extra?: {
    workflowId?: string;
  };
};

export type VinesToolDef = Omit<BlockDefinition, 'input' | 'output'> & {
  input: VinesBlockDefProperties[];
  output: VinesBlockDefProperties[];
};

export type VinesToolWithCategory = [VinesToolDef[], number, string, string];
