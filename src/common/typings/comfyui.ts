export enum ComfyuiNodeType {
  CheckpointLoaderSimple = 'CheckpointLoaderSimple',
  CLIPTextEncode = 'CLIPTextEncode',
  VAEDecode = 'VAEDecode',
  SaveImage = 'SaveImage',
  LoadImage = 'LoadImage',
  VAEEncode = 'VAEEncode',
  KSampler = 'KSampler',
  KSamplerEfficient = 'KSampler (Efficient)',
  VAEEncodeForInpaint = 'VAEEncodeForInpaint',
  ImagePadForOutpaint = 'ImagePadForOutpaint',
  UpscaleModelLoader = 'UpscaleModelLoader',
  ImageUpscaleWithModel = 'ImageUpscaleWithModel',
  LoraLoader = 'LoraLoader',
  IPAdapterModelLoader = 'IPAdapterModelLoader',
  CLIPVisionLoader = 'CLIPVisionLoader',
  Reroute = 'Reroute',
  GetNode = 'GetNode',
  Note = 'Note',
  SetNode = 'SetNode',
  VHS_LoadVideo = 'VHS_LoadVideo',
  VHS_LoadVideoPath = 'VHS_LoadVideoPath',
}

export const ComfyuiNodesNoNeedInstall: ComfyuiNodeType[] = [ComfyuiNodeType.Reroute, ComfyuiNodeType.GetNode, ComfyuiNodeType.Note, ComfyuiNodeType.SetNode];

export enum ComfyuiNodeOutputType {
  MODEL = 'MODEL',
  CLIP = 'CLIP',
  VAE = 'VAE',
  CONDITIONING = 'CONDITIONING',
  LATENT = 'LATENT',
  IMAGE = 'IMAGE',
  MASK = 'MASK',
  UPSCALE_MODEL = 'UPSCALE_MODEL',
}

export interface ComfyuiNodeOutput {
  name: string;
  type: ComfyuiNodeOutputType;
  links?: Array<number>;
  shape?: number;
  slot_index?: number;
  label: string;
}

export interface ComfyuiNodeInput {
  name: string;
  type: ComfyuiNodeOutputType;
  link?: number;
  label: string;
}

export interface ComfyuiNode {
  id?: number;
  type: ComfyuiNodeType;
  pos: [number, number];
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
    class_type: ComfyuiNodeType;
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
  nodes: ComfyuiNode[];
  links: ComfyuiLink[];
}

export interface ComfyuiWorkflowWithPrompt {
  workflow: ComfyuiWorkflow;
  prompt?: ComfyuiPrompt;
}
