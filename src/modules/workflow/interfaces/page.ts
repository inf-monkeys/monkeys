/* eslint-disable @typescript-eslint/no-namespace */
import { AssetType, I18nValue, MonkeyWorkflow } from '@inf-monkeys/monkeys';

export type IPagePermission = 'read' | 'write' | 'exec' | 'permission';

export type IPageInstanceType = 'process' | 'log' | 'chat' | 'preview' | 'api' | 'agent-chat' | 'agent-config' | 'agent-log' | 'design-board' | 'global-design-board' | 'iframe';

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
  customOptions?: Record<string, any>;
  instance: IPageInstance;
}

export type IPinPage = IPageType & {
  workflowId?: string;
  designMetadataId?: string;
  workflow?: MonkeyWorkflow & {
    id?: string;
  };
  agent?: {
    displayName: string | Record<string, string>;
    description?: string | Record<string, string>;
    customModelName?: string;
    model: string;
    systemPrompt?: string;
    knowledgeBase?: string;
    sqlKnowledgeBase?: string;
    tools?: string[];
    temperature?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    createdTimestamp?: string;
    updatedTimestamp?: string;
    id: string;
    name: string;
    iconUrl?: string;
    teamId?: string;
    creatorUserId?: string;
    assetType?: AssetType;
    isDeleted?: boolean;
    isPreset?: boolean;
    isPublished?: boolean;
    isActive?: boolean;
  };
  designProject?: {
    id: string;
    name: string;
    description?: string | I18nValue;
    teamId?: string;
    creatorUserId?: string;
    assetType?: AssetType;
    isDeleted?: boolean;
    isPreset?: boolean;
    isPublished?: boolean;
    isActive?: boolean;
    displayName: string | Record<string, string>;
    createdTimestamp: number;
    updatedTimestamp: number;
    boardIds?: string[];
    iconUrl?: string;
  };
  iframeUrl?: string;
  info?: {
    displayName?: string | I18nValue;
    description?: string | I18nValue;
    iconUrl?: string;
  };
};

export interface IPageGroup {
  id: string;
  pageIds: string[];
  displayName: string | Record<string, string>;
  isBuiltIn: boolean;
  iconUrl?: string;
  sortIndex?: number | null;
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
