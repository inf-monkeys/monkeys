import { I18nValue, ToolProperty } from '@inf-monkeys/monkeys';

import { IBaseEntity } from '@/apis/typings.ts';

export interface IComfyuiModelLegacy {
  [x: string]: string[];
}

export enum ComfyuiServerStatus {
  Unkonwn = 'UNKOWN',
  UP = 'UP',
  DOWN = 'DOWN',
}

export interface IComfyuiServer extends Omit<IBaseEntity, 'uuid'> {
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
  displayName: string | I18nValue;
  createdTimestamp: number;
  updatedTimestamp: number;
  description: string | I18nValue;
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
