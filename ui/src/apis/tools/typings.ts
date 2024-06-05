import { BlockDefinition } from '@inf-monkeys/vines';
import { BlockDefProperties } from '@inf-monkeys/vines/src/models/BlockDefDto.ts';

import { VinesNode } from '@/package/vines-flow/core/nodes';

export interface BlockDefPropertiesExtended extends BlockDefProperties {
  id: number;
  vinesNode?: VinesNode;
  extra?: {
    workflowId?: string;
  };
}

export type ChargeMode = 'free' | 'per-execute' | 'script' | 'per-1k-token' | 'per-1min' | 'per-1mb-file';

export interface BlockPricing {
  mode: ChargeMode;
  unitPriceAmount: number;
}

export interface BlockDefinitionExtended extends BlockDefinition {
  input: BlockDefPropertiesExtended[];
  pricing?: BlockPricing;
}

export interface IWorkflowBlock extends BlockDefinitionExtended {
  id: string;
  namespace: string;
}
