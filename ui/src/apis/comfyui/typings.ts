import { ToolProperty } from '@inf-monkeys/monkeys';

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
  Json = 'json',
  Comfyfile = 'comfyfile',
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
  toolInput: ToolProperty[];
  toolOutput: ToolProperty[];
}

export interface IComfyuiWorkflowDependencyNode {
  author: string;
  title: string;
  id: string;
  reference: string;
  files: string[];
  install_type: string;
  description: string;
  stars: number;
  last_update: string;
  installed: 'False' | 'True';
}

export interface IComfyuiWorkflowDependencyModel {
  name: string;
  installed: 'False' | 'True';
}

export interface IComfyuiWorkflowDependency {
  nodes: IComfyuiWorkflowDependencyNode[];
  models: IComfyuiWorkflowDependencyModel[];
}
