import { I18nValue } from '@inf-monkeys/monkeys';

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

export type VinesSpaceHeadBarIdType = 'workbench' | 'app-store' | 'workspace';
export type VinesSpaceHeadbarModule = {
  id: VinesSpaceHeadBarIdType | string;
  displayName?: string | I18nValue;
  visible?: boolean;
  disabled?: boolean;
  icon?: string;
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

export type CustomizationHeadbarTheme = 'fixed' | 'card' | 'glassy';
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

export type WorkflowPreviewExecutionGrid = {
  selectionModeDisplayType?: SelectionModeDisplayType;
  clickBehavior?: ClickBehavior;
  showErrorFilter?: boolean;
};

export type CustomizationHistoryResult = {
  display: boolean;
};

export type CustomizationForm = {
  variant: 'bento' | 'ghost';
};

export type ExtraLanguageURL = Record<'en' | 'zh', string>;

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
    icons?: {
      error?: string;
    };
    views: {
      form: {
        toast: {
          afterCreate: boolean;
          afterDelete: boolean;
        };
        progress: 'estimate' | 'infinite';
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
