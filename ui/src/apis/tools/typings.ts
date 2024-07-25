import { ToolDef, ToolProperty } from '@inf-monkeys/monkeys';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings.ts';
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
  createdTimestamp: number;
  updatedTimestamp: number;
}

export type ICommonTool =
  | (IComfyuiWorkflow & {
      toolType: 'comfyui';
      categories: ['comfyui'];
      name: string;
    })
  | (IWorkflowTool & {
      toolType: 'tool';
      iconUrl?: string;
    })
  | (Omit<IWorkflowTool, 'categories'> & {
      toolType: 'api';
      iconUrl?: string;
      categories: ['api'];
    })
  | (Omit<IWorkflowTool, 'categories'> & {
      toolType: 'service';
      iconUrl?: string;
      categories: ['service'];
    });
