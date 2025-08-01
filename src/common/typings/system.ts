import { AuthMethod, CustomizationHeadbar, CustomizationModules, ExtraLanguageURL, WorkflowPreviewExecutionGrid } from '../config';
export type OemModule = 'payment' | 'vines-ai';

export interface ISystemConfig {
  theme: {
    title: string;
    favicon: {
      light: string;
      dark: string;
    };
    logo: {
      light: string;
      dark: string;
    };
    colors: {
      primaryColor: string;
      neocardColor: string;
      neocardDarkColor: string;
    };
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    icons: {
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
      showFormInImageDetail?: boolean;
    };
    modules: CustomizationModules;
    headbar: CustomizationHeadbar;
    paginationPosition?: 'left' | 'right';
    ugcViewIconOnlyMode?: boolean;
    workflowPreviewExecutionGrid?: WorkflowPreviewExecutionGrid;
    workbenchSidebarDefaultOpen: boolean;
    workbenchSidebarMoreAction: boolean;
    uniImagePreview: boolean;
    imagePreviewStyle: 'simple' | 'normal' | 'uni';
    teamAsUser: boolean;
  };
  auth: {
    enabled: AuthMethod[];
    oidc: {
      buttonText: string;
      autoSignin: boolean;
    };
    hideAuthToast: boolean;
    autoReload: boolean;
    defaultOtherTeam: boolean;
  };
  pages: {
    allowPageKeys: string[] | '*';
  };
  endpoints: {
    clientUrl: string;
    [name: string]: string;
  };
  module: OemModule[] | '*';
}
