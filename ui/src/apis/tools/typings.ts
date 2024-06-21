import { ToolDef, ToolProperty } from '@inf-monkeys/monkeys';

import { VinesNode } from '@/package/vines-flow/core/nodes';

export interface ToolPropertyExtended extends ToolProperty {
  id: number;
  vinesNode?: VinesNode;
  extra?: {
    workflowId?: string;
  };
}

export type ChargeMode = 'free' | 'per-execute' | 'script' | 'per-1k-token' | 'per-1min' | 'per-1mb-file';

export interface ToolPricing {
  mode: ChargeMode;
  unitPriceAmount: number;
}

export interface ToolDefExtended extends ToolDef {
  input: ToolPropertyExtended[];
  pricing?: ToolPricing;
}

export interface IWorkflowTool extends ToolDefExtended {
  id: string;
  namespace: string;
}
