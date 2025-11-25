import { I18nValue } from '@inf-monkeys/monkeys';

import { IPageGroup, IPinPage } from '../pages/typings';

export type SystemModule = 'payment' | 'vines-ai';

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
  oauth = 'oauth',
}

export type VinesSpaceSidebarModule =
  | 'apps'
  | 'agents'
  | 'workflows'
  | 'evaluations'
  | 'designs'
  | 'design-projects'
  | 'design-assets'
  | 'tools'
  | 'model'
  | 'text-models'
  | 'image-models'
  | 'media'
  | 'text-data'
  | 'table-data'
  | 'chat-v2'
  | 'model-training'
  | 'model-training-v2'
  | 'neural-models';
export type VinesSpaceSidebarModules = '*' | VinesSpaceSidebarModule[];

export type VinesSpaceHeadBarIdType = 'workbench' | 'app-store' | 'workspace';
export type VinesSpaceHeadbarModule = {
  id: VinesSpaceHeadBarIdType | string;
  extraInfo?: boolean;
  displayName?: string | I18nValue;
  visible?: boolean;
  disabled?: boolean;
  icon?: string;
  showQuickSwitcher?: boolean;
};
export type VinesSpaceHeadbarModules = VinesSpaceHeadbarModule[];

export type SettingsSidebarModule = 'account' | 'config' | 'stat' | 'apikey';
export type SettingsSidebarModules = '*' | SettingsSidebarModule[];

export type CustomizationModules =
  | {
      vinesSpaceSidebar?: VinesSpaceSidebarModules;
      vinesSpaceHeadbar?: VinesSpaceHeadbarModules;
      settingsSidebar?: SettingsSidebarModules;
    }
  | undefined;

export type VinesSpaceHeadbar = 'team-invite' | 'team-selector' | 'user-profile';
export type VinesSpaceHeadbarProfile = 'dark-mode' | 'language' | 'settings' | 'logout';

export type CustomizationHeadbarTheme = 'fixed' | 'card' | 'glassy' | 'ghost' | 'bsd-blue';
export type CustomizationHeadbarNavPosition = 'left' | 'center' | 'right';

export type CustomizationHeadbar =
  | {
      theme?: CustomizationHeadbarTheme;
      navPosition?: CustomizationHeadbarNavPosition;
      actions?: VinesSpaceHeadbar[] | '*';
      profile?: VinesSpaceHeadbarProfile[] | '*';
    }
  | undefined;

export type CustomizationDensity = 'compact' | 'default';

export type SelectionModeDisplayType = 'operation-button' | 'dropdown-menu';
export type ClickBehavior = 'preview' | 'select' | 'fill-form';

export type ExectuionResultGridDisplayType = 'grid' | 'masonry';

export type WorkflowPreviewExecutionGrid = {
  selectionModeDisplayType?: SelectionModeDisplayType;
  clickBehavior?: ClickBehavior;
  showErrorFilter?: boolean;
  displayType?: ExectuionResultGridDisplayType;
  showDetailButton?: boolean;
};

export type CustomizationHistoryResult = {
  display: boolean;
};

export type CustomizationForm = {
  variant: 'bento' | 'ghost';
};

export type CustomizationUploader = {
  orientation: 'vertical' | 'horizontal';
  pasteButton: boolean;
  statusText: boolean;
};

export type CustomizationFormView = {
  toast: {
    afterCreate: boolean;
    afterDelete: boolean;
  };
  progress: 'estimate' | 'infinite';
  onlyResult: boolean;
  tabular: {
    theme: 'tentiary' | 'primary';
  };
};

export type CustomizationDesignProjects = {
  oneOnOne: boolean;
  newTabOpenBoard: boolean;
  showPageMenu: boolean;
  showMainMenu: boolean;
  showStylePanel: boolean;
  showToolbar: boolean;
  showContextMenu: boolean;
  showPageAndLayerSidebar?: boolean; // 是否显示左侧 页面+图层 sidebar，默认 false
  showMiniToolsToolbar?: boolean; // 是否显示小工具工具栏，默认 false
  showRealtimeDrawing?: boolean; // 是否显示实时绘画工具栏，默认 false
  showWorkflow?: boolean; // 是否显示 Workflow 工具栏，默认 false
  showAgent?: boolean; // 是否显示 Agent 按钮，默认 false
};

export type ExtraLanguageURL = Record<'en' | 'zh', string>;

export type CustomizationWorkbench = {
  pages: IPinPage[];
  pageGroups: IPageGroup[];
};

export type CustomizationUgc = {
  onItemClick: boolean;
  subtitle: boolean;
};

export type CustomIcon = {
  color?: string;
  url?: string;
  type?: 'svg' | 'image';
  hintTextColor?: string;
};

export type CustomIcons = {
  error?: CustomIcon;
  empty?: CustomIcon;
};

export type SystemConfigBehavior = {
  clearWorkflowFormStorageAfterUpdate: boolean;
};

export interface ISystemConfig {
  theme: {
    id?: string;
    name: string;
    favicon: {
      dark: string;
      light: string;
    };
    logo: {
      dark: string;
      light: string;
    };
    background?: string;
    colors: {
      primaryColor: string;
      neocardColor: string;
      neocardDarkColor: string;
    };
    gradient?: string;
    roundedSize?: string;
    form?: CustomizationForm;
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    icons?: CustomIcons;
    views: {
      form: CustomizationFormView;
    };
    extraLanguageURL?: ExtraLanguageURL;
    hideSpaceHeader: boolean;
    showSidebarTeamSelector: boolean;
    defaults: {
      showFormInImageDetail: boolean;
    };
    modules: CustomizationModules;
    headbar: CustomizationHeadbar;
    paginationPosition?: 'left' | 'right';
    ugcViewIconOnlyMode?: boolean;
    workflowPreviewExecutionGrid?: WorkflowPreviewExecutionGrid;
    workbenchSidebarDefaultOpen?: boolean;
    workbenchSidebarMoreAction?: boolean;
    workbenchSidebarApart?: boolean;
    workbenchSidebarToggleGroupDetail?: boolean;
    workbenchSidebarViewType?: boolean;
    workbenchSidebarFormViewEmbed?: boolean;
    workbenchSidebarModernMode?: boolean;
    ugc: CustomizationUgc;
    uniImagePreview?: boolean;
    imagePreviewStyle: 'simple' | 'normal' | 'uni';
    teamAsUser: boolean;
    themeMode: 'shadow' | 'border';
    density: CustomizationDensity;
    miniMode: {
      showPreviewViewExecutionResultGrid: boolean;
    };
    workflow: {
      allowConcurrentRuns: boolean;
    };
    historyResult: CustomizationHistoryResult;
    uploader: CustomizationUploader;
    designProjects: CustomizationDesignProjects;
    workbench: CustomizationWorkbench;
    visionProWorkflows?: string[];
    initTeam: boolean;
    imageThumbnail?: boolean;
  };
  auth: {
    enabled: AuthMethod[];
    oidc?: {
      buttonText?: string;
      autoSignin?: boolean;
    };
    hideAuthToast?: boolean;
    autoReload?: boolean;
    defaultOtherTeam?: boolean;
  };
  pages: {
    allowPageKeys: string[] | '*';
  };
  endpoints: {
    clientUrl: string;
    [name: string]: string;
  };
  module: SystemModule[] | '*';
  behavior: SystemConfigBehavior;
}
