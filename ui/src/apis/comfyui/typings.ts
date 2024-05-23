import { BlockDefProperties } from '@inf-monkeys/vines';

export interface IComfyuiModel {
  [x: string]: string[];
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
