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
  | 'table-data';
export type VinesSpaceSidebarModules = '*' | VinesSpaceSidebarModule[];

export type VinesSpaceHeadbarModule = 'workbench' | 'app-store' | 'workspace';
export type VinesSpaceHeadbarModules = '*' | VinesSpaceHeadbarModule[];

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

export type CustomizationHeadbar =
  | {
      actions?: VinesSpaceHeadbar[] | '*';
      profile?: VinesSpaceHeadbarProfile[] | '*';
    }
  | undefined;

export type SelectionModeDisplayType = 'operation-button' | 'dropdown-menu';
export type ClickBehavior = 'preview' | 'select' | 'fill-form';

export type WorkflowPreviewExecutionGrid = {
  selectionModeDisplayType?: SelectionModeDisplayType;
  clickBehavior?: ClickBehavior;
  showErrorFilter?: boolean;
};

export type ExtraLanguageURL = Record<'en' | 'zh', string>;

export interface ISystemConfig {
  theme: {
    name: string;
    favicon: {
      dark: string;
      light: string;
    };
    logo: {
      dark: string;
      light: string;
    };
    colors: {
      primaryColor: string;
    };
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    icons?: {
      error?: string;
    };
    views: {
      form: {
        toast: {
          afterCreate: boolean;
          afterDelete: boolean;
        };
      };
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
}
