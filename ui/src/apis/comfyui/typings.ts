import { BlockDefProperties } from '@inf-monkeys/vines';

export interface IComfyuiModel {
  [x: string]: string[];
}

export enum ComfyuiServerStatus {
  Unkonwn = 'UNKOWN',
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface IComfyuiServer {
  address: string;
  status: ComfyuiServerStatus;
  description: string;
  isDefault: boolean;
}

export enum ComfyuiWorkflowSourceType {
  Image = 'image',
  WorkflowApiJson = 'workflow_api_json',
}

export interface IComfyuiWorkflow {
  id: string;
  displayName: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  description: string;
  iconUrl?: string;
  teamId: string;
  creatorUserId: string;
  workflowType: ComfyuiWorkflowSourceType;
  originalData: { [x: string]: any };
  workflow?: { [x: string]: any };
  prompt: { [x: string]: any };
  toolName: string;
  toolInput: BlockDefProperties[];
}

export interface IComfyuiWorkflowDependencyUninstalledNode {
  author: string;
  title: string;
  id: string;
  reference: string;
  files: string[];
  install_type: string;
  description: string;
  stars: number;
  last_update: string;
  installed: 'False';
}

export interface IComfyuiWorkflowDependency {
  uninstalled_nodes: IComfyuiWorkflowDependencyUninstalledNode[];
}
