import { ToolDef, ToolProperty } from '@inf-monkeys/monkeys';

import { VinesNode } from '@/package/vines-flow/core/nodes';

export interface ToolPropertyExtended extends ToolProperty {
  id: number;
  vinesNode?: VinesNode;
  extra?: {
    workflowId?: string;
  };
}

export type ChargeMode = 'FREE' | 'PER_EXECUTR' | 'PER_1MIN' | 'PER_1K_TOKEN';

export interface ToolPricing {
  pricingRule: ChargeMode;
  unitPrice: number;
}

export interface ToolDefExtended extends ToolDef {
  input: ToolPropertyExtended[];
  extra: ToolDef['extra'] & ToolPricing;
}

export interface IWorkflowTool extends ToolDefExtended {
  id: string;
  namespace: string;
}
