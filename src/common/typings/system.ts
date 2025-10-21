import {
  AuthMethod,
  CustomizationDensity,
  CustomizationDesignProjects,
  CustomizationForm,
  CustomizationFormView,
  CustomizationHeadbar,
  CustomizationHistoryResult,
  CustomizationModules,
  CustomizationUgc,
  CustomizationUploader,
  CustomizationWorkbench,
  ExtraLanguageURL,
  WorkflowPreviewExecutionGrid,
} from '../config';
export type OemModule = 'payment' | 'vines-ai';

export interface ISystemConfig {
  theme: {
    id: string;
    title: string;
    background?: string;
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
    gradient?: string;
    roundedSize?: string;
    form: CustomizationForm;
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    icons: {
      error?: string;
    };
    views: {
      form: CustomizationFormView;
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
    workbenchSidebarApart: boolean;
    workbenchSidebarToggleGroupDetail: boolean;
    workbenchSidebarViewType: boolean;
    workbenchSidebarFormViewEmbed: boolean;
    ugc: CustomizationUgc;
    uniImagePreview: boolean;
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
