import { ComfyuiWorkflowFileType } from '../dto/req/import-from-comfyui.dto';

export class InstallComfyUIModelParams {
  url: string;
  type: string;
  filename: string;
}

export interface LoadComfyuiWorkflowParams {
  fileType: ComfyuiWorkflowFileType;
  imageUrl?: string;
  workflowApiJsonUrl?: string;
  workflowJsonUrl?: string;
}

export interface ImportFromComfyuiParams {
  fileType: ComfyuiWorkflowFileType;
  imageUrl: string;
  workflowApiJsonUrl: string;
  workflowJsonUrl: string;
  displayName: string;
  description: string;
  icon: string;
}

export interface CheckComfyUIWorkflowDependenciesParams {
  fileType: ComfyuiWorkflowFileType;
  imageUrl?: string;
  workflowApiJsonUrl?: string;
  workflowJsonUrl?: string;
}

export enum ComfyuiDepencencyType {
  NODE = 'NODE',
  MODEL = 'MODEL',
}

export interface ComfyuiModelDepencency {
  type: string;
  name: string;
}

export interface ComfyuiDepencency {
  type: ComfyuiDepencencyType;
  data: { [x: string]: any };
}

export interface UpdateComfyuiWorkflowParams {
  fileType: ComfyuiWorkflowFileType;
  imageUrl?: string;
  workflowApiJsonUrl?: string;
  workflowJsonUrl?: string;
}
