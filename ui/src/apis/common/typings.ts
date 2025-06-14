export type SystemModule = 'payment' | 'vines-ai';

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
  oauth = 'oauth',
}

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
