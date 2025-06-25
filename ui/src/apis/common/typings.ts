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
export type VinesSpaceSidebarModules = undefined | '*' | VinesSpaceSidebarModule[];

export type VinesSpaceHeadbarModule = 'workbench' | 'app-store' | 'workspace';
export type VinesSpaceHeadbarModules = undefined | '*' | VinesSpaceHeadbarModule[];

export type SettingsSidebarModule = 'account' | 'config' | 'stat' | 'apikey';
export type SettingsSidebarModules = undefined | '*' | SettingsSidebarModule[];

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
    hideSpaceHeader: boolean;
    showSidebarTeamSelector: boolean;
    showSidebarPageGroup: boolean;
    defaults: {
      showFormInImageDetail: boolean;
    };
    modules: {
      vinesSpaceSidebar: VinesSpaceSidebarModules;
      vinesSpaceHeadbar: VinesSpaceHeadbarModules;
      settingsSidebar: SettingsSidebarModules;
    };
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
