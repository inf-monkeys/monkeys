import {
    AuthMethod,
    CustomIcons,
    CustomizationDefaults,
    CustomizationDensity,
    CustomizationDesignProjects,
    CustomizationForm,
    CustomizationFormView,
    CustomizationHeadbar,
    CustomizationHistoryResult,
    CustomizationLoginPage,
    CustomizationLoginPageTheme,
    CustomizationModules,
    CustomizationUgc,
    CustomizationUploader,
    CustomizationWorkbench,
    CustomizationWorkbenchViewTheme,
    ExtraLanguageURL,
    SystemConfigBehavior,
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
    icons: CustomIcons;
    loginPage?: CustomizationLoginPage & { theme?: CustomizationLoginPageTheme };
    views: {
      form: CustomizationFormView;
    };
    extraLanguageURL?: ExtraLanguageURL;
    hideSpaceHeader: boolean;
    showSidebarTeamSelector: boolean;
    showWorkbenchSidebar?: boolean;
    workbenchViewTheme?: CustomizationWorkbenchViewTheme;
    defaults: CustomizationDefaults;
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
    workbenchSidebarModernMode: boolean;
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
    imageThumbnail?: boolean;
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
  behavior: SystemConfigBehavior;
}
