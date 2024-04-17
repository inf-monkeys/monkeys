import { MonkeyWorkflow } from '@inf-monkeys/vines';

export type IPagePermission = 'read' | 'write' | 'exec' | 'permission';

export type IPageInstanceType = 'process' | 'log' | 'chat' | 'preview' | 'api';

export interface IPageInstance {
  name: string;
  icon: string;
  type: IPageInstanceType;
  allowedPermissions: IPagePermission[];
  // customOptionsProperties?: BlockDefPropertiesExtended[];
}

export interface IPageType {
  id: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted?: boolean;

  displayName: string;
  type: IPageInstance['type'];
  workflowId: string;
  isBuiltIn: boolean;
  creatorUserId: string;
  teamId: string;
  permissions: IPagePermission[];
  apiKey: string;
  sortIndex: number;
  pinned?: boolean;
  customOptions?: {
    joinTeam?: {
      enable?: boolean;
      url?: string;
    };
    theme?: {
      enable?: boolean;
      colors?: Record<string, string>;
    };
    parameterOptions?: {
      type?: 'all' | 'endpoint-only';
    };
    render?: {
      // type?: CanvasRenderType;
      useHorizontal?: boolean;
    };
  };
  instance: IPageInstance;
}

export type IPinPage = IPageType & {
  workflowId: string;
  workflow: MonkeyWorkflow;
};
