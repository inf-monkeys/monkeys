/* eslint-disable @typescript-eslint/no-namespace */
import { MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IAgent } from '@/apis/agents/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export type IPagePermission = 'read' | 'write' | 'exec' | 'permission';

export type IPageInstanceType = 'process' | 'log' | 'chat' | 'preview' | 'api';

export interface IPageInstance {
  name: string;
  icon: string;
  type: IPageInstanceType;
  allowedPermissions?: IPagePermission[];
  // customOptionsProperties?: ToolPropertyExtended[];
}

export interface IPageType {
  id: string;
  createdTimestamp?: number;
  updatedTimestamp?: number;
  isDeleted?: boolean;

  displayName: string;
  type: IPageInstance['type'];
  workflowId: string;
  isBuiltIn: boolean;
  creatorUserId?: string;
  teamId?: string;
  permissions?: IPagePermission[];
  apiKey?: string;
  sortIndex?: number;
  pinned?: boolean;
  customOptions?: {
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
  agent: IAssetItem<IAgent>;
};

export interface IPageGroup {
  id: string;
  pageIds: string[];
  displayName: string;
  isBuiltIn: boolean;
}

export type IPinningPage = {
  pages: IPinPage[];
  groups: IPageGroup[];
};

export declare type CreatePageDto = {
  /**
   * 类型
   */
  type: CreatePageDto.type;
  /**
   * 权限
   */
  permissions: Array<'read' | 'write' | 'exec' | 'permission'>;
  /**
   * 页面名称
   */
  displayName: string;
  /**
   * 序号（越小越靠前）
   */
  sortIndex: string;
  /**
   * 自定义配置项
   */
  customOptions: any;
};
export declare namespace CreatePageDto {
  /**
   * 类型
   */
  enum type {
    PROCESS = 'process',
    LOG = 'log',
    CHAT = 'chat',
    PREVIEW = 'preview',
    API = 'api',
  }
}
