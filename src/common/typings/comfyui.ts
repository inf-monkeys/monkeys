export interface ComfyuiNodeOutput {
  name: string;
  type: string;
  links?: Array<number>;
  shape?: number;
  slot_index?: number;
  label?: string;
}

export interface ComfyuiNodeInput {
  name: string;
  type: string;
  link?: number;
  label?: string;
  slot_index?: number;
}

export interface ComfyuiNode {
  id?: number;
  type: string;
  pos: [number, number];
  size?: any;
  flags: { [x: string]: number };
  order: number;
  mode: number;
  inputs?: ComfyuiNodeInput[];
  outputs?: ComfyuiNodeOutput[];
  title?: string;
  properties: {
    'Node name for S&R': string;
  };
  widgets_values?: any[];
}

export type ComfyuiLink = [number, number, number, number, number, string];

export interface LinkNodeProps {
  sourceNodeId: number;
  sourceNodeOutputIndex: number;
  targetNodeId: number;
  targetNodeInputIndex: number;
  label: string;
}

export interface RemoveLinkProps {
  sourceNodeId: number;
  sourceNodeOutputIndex: number;
  targetNodeId: number;
  targetNodeInputIndex: number;
}

export interface ComfyuiPrompt {
  [x: string]: {
    inputs: { [x: string]: any };
    class_type: string;
    _meta?: any;
  };
}

export interface KSamplerInput {
  steps: number;
  cfgScale: number;
  sampler_name: string;
  scheduler: string;
  denoise: number;
}

export interface ComfyuiWorkflow {
  last_node_id?: number;
  last_link_id?: number;
  nodes: ComfyuiNode[];
  links: ComfyuiLink[];
  groups?: any[];
  config?: any;
  extra?: any;
  version?: number;
}

export interface ComfyuiWorkflowWithPrompt {
  workflow: ComfyuiWorkflow;
  prompt?: ComfyuiPrompt;
}
