import { MonkeyWorkflow, ToolCategory, ToolDef, ToolProperty } from '@inf-monkeys/monkeys';

import { IComfyuiWorkflow } from '@/apis/comfyui/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
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
  | (Omit<IWorkflowTool, 'categories'> & {
      toolType: 'tool';
      categories: (ToolCategory | 'unknown')[];
    })
  | (Omit<IWorkflowTool, 'categories'> & {
      toolType: 'api';
      categories: ['api'];
    })
  | (Omit<IWorkflowTool, 'categories'> & {
      toolType: 'service';
      categories: ['service'];
    })
  | (IAssetItem<MonkeyWorkflow> & {
      toolType: 'sub-workflow';
      categories: ['sub-workflow'];
      icon?: string | undefined;
    });
