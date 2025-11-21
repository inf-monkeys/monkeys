import { IPageGroup, IPinPage } from '@/modules/workflow/interfaces/page';
import { I18nValue } from '@inf-monkeys/monkeys';
import { ClusterNode, RedisOptions, SentinelAddress } from 'ioredis';
import { ClientAuthMethod } from 'openid-client';
import { DataSourceOptions } from 'typeorm';
import { getHostFromUrl, isValidUrl } from '../utils';
import { readConfig } from './readYaml';

export type DatabaseConfig = DataSourceOptions;

export interface ConductorConfig {
  baseUrl: string;
  auth?: {
    username: string;
    password: string;
  };
  polling: {
    interval: number;
    concurrency: number;
  };
  workerPrefix?: string;
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

export type CustomizationDensity = 'compact' | 'default';

export type CustomizationModules = {
  vinesSpaceSidebar?: VinesSpaceSidebarModules;
  vinesSpaceHeadbar?: VinesSpaceHeadbarModules;
  settingsSidebar?: SettingsSidebarModules;
};

export type VinesSpaceHeadbar = 'team-invite' | 'team-selector' | 'user-profile';
export type VinesSpaceHeadbarProfile = 'dark-mode' | 'language' | 'settings' | 'logout';

export type CustomizationHeadbarTheme = 'fixed' | 'card' | 'glassy' | 'ghost';
export type CustomizationHeadbar = {
  theme?: CustomizationHeadbarTheme;
  navPosition?: 'left' | 'center' | 'right';
  actions?: VinesSpaceHeadbar[] | '*';
  profile?: VinesSpaceHeadbarProfile[] | '*';
};

export type SelectionModeDisplayType = 'operation-button' | 'dropdown-menu';
export type ClickBehavior = 'preview' | 'select' | 'fill-form';

export type ExectuionResultGridDisplayType = 'grid' | 'masonry';

export type WorkflowPreviewExecutionGrid = {
  selectionModeDisplayType?: SelectionModeDisplayType;
  clickBehavior?: ClickBehavior;
  showErrorFilter?: boolean;
  displayType?: ExectuionResultGridDisplayType;
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
  createDefaultFrame: boolean;
  showPageMenu: boolean;
  showMainMenu: boolean;
  showStylePanel: boolean;
  showToolbar: boolean;
  showContextMenu: boolean;
  showActionsMenu: boolean; // 是否显示 tldraw 左上角原生操作条（撤销/重做/删除/重复/更多）
  showPageAndLayerSidebar?: boolean; // 是否显示左侧页面+图层侧边栏
  showBoardOperationSidebar?: boolean; // 是否显示画板操作侧边栏（宽/高、导出、保存）
  showMiniToolsToolbar?: boolean; // 是否显示小工具工具栏
  showRightSidebar?: boolean; // 是否显示右侧边栏
  showRealtimeDrawing?: boolean; // 是否显示实时绘画工具栏
  showWorkflow?: boolean; // 是否显示 Workflow 工具栏
  showAgent?: boolean; // 是否显示 Agent 按钮
};

export type ExtraLanguageURL = Record<'en' | 'zh', string>;

export type CustomizationWorkbench = {
  pages: IPinPage[];
  pageGroups: IPageGroup[];
};

export type CustomizationUgc = {
  onItemClick: boolean;
  subtitle?: boolean;
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

export interface ServerConfig {
  port: number;
  appId: string;
  appUrl: string;
  loadExample: boolean;
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  customization: {
    id: string;
    title: string;
    background?: string;
    logo: {
      light: string;
      dark: string;
    };
    favicon: {
      light: string;
      dark: string;
    };
    colors: {
      primary: string;
      neocard: string;
      neocardDark: string;
    };
    gradient?: string;
    roundedSize?: string;
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    icons: CustomIcons;
    views: {
      form: CustomizationFormView;
    };
    extraLanguageURL?: ExtraLanguageURL;
    hideSpaceHeader?: boolean;
    showSidebarTeamSelector?: boolean;
    defaults?: {
      showFormInImageDetail?: boolean;
    };
    modules?: CustomizationModules;
    headbar?: CustomizationHeadbar;
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
    form: CustomizationForm;
    uploader: CustomizationUploader;
    designProjects: CustomizationDesignProjects;
    marketplace: {
      presetAppSortFileUrl?: string;
      presetAppFileUrl?: string;
    };
    workbench: CustomizationWorkbench;
    visionProWorkflows?: string[];
  };
  webhook: {
    token?: string;
    backendBaseUrl?: string;
    initTeam?: string;
  };
  behavior: SystemConfigBehavior;
}

export enum RedisMode {
  standalone = 'standalone',
  cluster = 'cluster',
  sentinel = 'sentinel',
}

export interface RedisConfig {
  mode: RedisMode;

  // Standalone config
  url?: string;

  // Cluster config
  nodes?: ClusterNode[];

  // Sentinel config
  sentinels?: Array<Partial<SentinelAddress>>;
  sentinelName?: string;

  // Common config
  prefix: string;
  options?: RedisOptions;
}

export interface ToolServiceConfig {
  name: string;
  useProxy?: boolean;
  manifestUrl?: string;
}

export interface CronConfig {
  enabled: boolean;
}

export interface ComfyUICofig {
  comfyfileRepo: string;
  defaultServer: string;
  githubToken: string;
  refreshCron: string;
  apiToken?: string;
  autodl?: {
    token: string;
    machineIds: string[];
  };
}

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
  apikey = 'apikey',
  oauth = 'oauth',
}

export interface OIDCIdpConfig {
  auto_signin: boolean;
  client_id: string;
  client_secret: string;
  issuer: string;
  id_token_signed_response_alg: string;
  token_endpoint_auth_method: ClientAuthMethod;
  redirect_uri: string;
  post_logout_redirect_uri: string;
  scope: string;
  grant_type: string;
  response_type: string;
  button_text: string;
}

export interface PasswordConfig {
  saltTemplate: string;
}

export interface DysmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
  signName: string;
  templateCode: string;
}

export interface SMSConfig {
  provider: 'dysms';
  config: DysmsConfig;
}

export interface JwtConfig {
  secret: string;
  expires_in: number | string;
}

export interface WeWorkConfig {
  corpId: string;
  agentId: string;
  secret: string;
  passwdSalt: string;
}

export interface FeishuConfig {
  feishuApiUrl: string;
  appId: string;
  appSecret: string;
}

export interface AuthConfig {
  enabled: AuthMethod[];
  sessionSecret?: string;
  oidc?: OIDCIdpConfig;
  password?: PasswordConfig;
  jwt: JwtConfig;
  sms: SMSConfig;
  saltTotp?: string;
  totpPeriod?: number;
  totpDigits?: number;
  totpAlgorithm?: 'SHA-512' | 'SHA-1' | 'SHA-224' | 'SHA-256' | 'SHA-384' | 'SHA3-224' | 'SHA3-256' | 'SHA3-384' | 'SHA3-512';
  privilegedToken?: string;
  wework?: WeWorkConfig;
  feishu?: FeishuConfig;
  hideAuthToast?: boolean;
  autoReload?: boolean;
  defaultOtherTeam?: boolean;
}

export interface AdminConfig {
  username: string;
  password?: string;
  email: string;
}

export interface S3Config {
  proxy: boolean;
  randomFilename: boolean;
  autoGenerateThumbnail: boolean;
  isPrivate: boolean;
  forcePathStyle: boolean;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  publicAccessUrl: string;
}

export interface S3ThumbnailConfig {
  quality: number;
}

export type S3ThumbnailUrlPatternType = 'bucket-hostname' | 'provider-hostname';

export interface S3ThumbnailUrlPattern {
  id: string;
  type: S3ThumbnailUrlPatternType;
  hostname: string;
  preferred?: boolean;
  bucketSegment?: string;
}

export interface S3ThumbnailBucketConfig {
  id: string;
  name: string;
  provider: string;
  config: Record<string, any>;
  hostname: string;
  urlPatterns: S3ThumbnailUrlPattern[];
  preferredUrlPatternId: string;
  thumbnailPrefix?: string;
}

type RawS3ThumbnailUrlPattern = {
  id: string;
  type: S3ThumbnailUrlPatternType;
  hostname: string;
  preferred?: boolean;
  bucketSegment?: string;
};

type RawS3ThumbnailBucketConfig = {
  id: string;
  name: string;
  provider: string;
  config?: Record<string, any>;
  urlPatterns?: RawS3ThumbnailUrlPattern[];
  thumbnailPrefix?: string;
};

const normalizeS3ThumbnailUrlPatterns = (bucketId: string, patterns?: RawS3ThumbnailUrlPattern[]): S3ThumbnailUrlPattern[] => {
  if (!patterns || patterns.length === 0) {
    throw new Error(`Bucket ${bucketId} 缺少 urlPatterns 配置`);
  }

  return patterns.map((pattern, index) => {
    if (!pattern || typeof pattern !== 'object') {
      throw new Error(`Bucket ${bucketId} 的 urlPatterns[${index}] 配置无效`);
    }
    if (!pattern.id) {
      throw new Error(`Bucket ${bucketId} 的 urlPattern 缺少 id`);
    }
    if (!pattern.hostname) {
      throw new Error(`Bucket ${bucketId} 的 urlPattern ${pattern.id} 缺少 hostname`);
    }
    if (pattern.type === 'provider-hostname' && !pattern.bucketSegment) {
      throw new Error(`Bucket ${bucketId} 的 urlPattern ${pattern.id} 缺少 bucketSegment`);
    }

    return {
      id: pattern.id,
      type: pattern.type,
      hostname: pattern.hostname,
      preferred: pattern.preferred ?? false,
      bucketSegment: pattern.bucketSegment,
    };
  });
};

const normalizeS3ThumbnailBucketConfig = (rawBucket: RawS3ThumbnailBucketConfig): S3ThumbnailBucketConfig => {
  if (!rawBucket || typeof rawBucket !== 'object') {
    throw new Error('存在无效的 s3-thumb-buckets 配置');
  }
  if (!rawBucket.id) {
    throw new Error('存在缺少 id 的 s3-thumb-bucket 配置');
  }
  if (!rawBucket.name) {
    throw new Error(`Bucket ${rawBucket.id} 缺少 name 配置`);
  }
  if (!rawBucket.provider) {
    throw new Error(`Bucket ${rawBucket.id} 缺少 provider 配置`);
  }

  const urlPatterns = normalizeS3ThumbnailUrlPatterns(rawBucket.id, rawBucket.urlPatterns);
  const preferredPattern = urlPatterns.find((pattern) => pattern.preferred) || urlPatterns[0];

  if (!preferredPattern) {
    throw new Error(`Bucket ${rawBucket.id} 至少需要一个 urlPattern`);
  }

  return {
    id: rawBucket.id,
    name: rawBucket.name,
    provider: rawBucket.provider,
    config: rawBucket.config || {},
    hostname: preferredPattern.hostname,
    urlPatterns,
    preferredUrlPatternId: preferredPattern.id,
    thumbnailPrefix: rawBucket.thumbnailPrefix,
  };
};

export enum LlmModelEndpointType {
  CHAT_COMPLETIONS = 'chat_completions',
  COMPLITIONS = 'completions',
}

export interface LlmModelConfig {
  model: string | string[];
  baseURL: string;
  apiKey?: string;
  displayName?: string;
  description?: string;
  iconUrl?: string;
  defaultParams?: { [x: string]: any };
  autoMergeConsecutiveMessages?: boolean;
  type?: LlmModelEndpointType[];
  promptTemplate?: string;
  max_tokens?: number;
  // If true, this model will be used as default model when create workflow from marketplace
  use_as_default?: boolean;
}

export interface LLmConfig {
  toolResultMaxLength: number;
  templates: {
    knowledgeBase: string;
    knowledgeBaseWithPresetPrompt: string;
  };
  maxRetries: number;
  timeout: number;
}

export interface ProxyConfig {
  enabled: boolean;
  url?: string;
  exclude?: string[];
}

export interface PaymentServerConfig {
  enabled: boolean;
  baseUrl: string;
}

export interface OneApiConfig {
  enabled: boolean;
  baseURL: string;
  rootToken?: string;
  rootUsername?: string;
  rootPassword?: string;
}

export interface AwsConfig {
  translate: {
    region: string;
    accessKey: string;
    secretKey: string;
  };
}

export interface TenantStatisticsConfig {
  bearer: string;
}

export interface EvaluationConfig {
  defaultLlmEvaluatorModel: string;
}

export type TelemetryConfig = {
  enabled: boolean;
  appDeployment?: string;
  appGroup?: string;
  appName?: string;
  appOwnerTeam?: string;
  functionGroup?: string;
  loggingServiceUrl?: string;
  loggingApiKey?: string;
};

export interface AgentV2Config {
  // OpenAI Compatible API configuration
  openaiCompatible: {
    url: string; // e.g., https://api.openai.com/v1
    apiKey: string; // API key for authentication
    models: string[]; // Available models list, e.g., ["gpt-4", "gpt-3.5-turbo", "claude-3-sonnet"]
    webSearchModel?: string; // Model ID for web search functionality, e.g., "gpt-4o-search-preview-2025-03-11"
  };

  // Rate limiting (hard-coded per team)
  rateLimits: {
    perMinute: number; // Default: 60
    perDay: number; // Default: 1000
  };

  // Default model parameters
  defaults: {
    temperature: number; // Default: 0.7
    maxTokens: number; // Default: 4096
    timeout: number; // Default: 30000ms
  };

  // Web search configuration
  webSearch?: {
    enabled: boolean; // Enable/disable web search functionality
    maxTokensPerSearch?: number; // Maximum tokens per search request, default: 2000
    timeout?: number; // Search request timeout in milliseconds, default: 60000ms
  };
}

export interface ModelTrainingConfig {
  endpoint: string; // Model training service endpoint
}

export interface AgentV3ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  models?: string[];
}

export interface AgentV3Config {
  defaultModelId?: string;
  openai?: AgentV3ProviderConfig;
  openaiCompatible?: AgentV3ProviderConfig;
  anthropic?: AgentV3ProviderConfig;
  google?: AgentV3ProviderConfig;
}

export interface Config {
  server: ServerConfig;
  conductor: ConductorConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  tools: ToolServiceConfig[];
  cron: CronConfig;
  comfyui: ComfyUICofig;
  auth: AuthConfig;
  s3: S3Config;
  s3Thumbnail: S3ThumbnailConfig;
  s3ThumbnailBuckets: S3ThumbnailBucketConfig[];
  models: LlmModelConfig[];
  proxy: ProxyConfig;
  llm: LLmConfig;
  paymentServer: PaymentServerConfig;
  oneapi: OneApiConfig;
  aws: AwsConfig;
  tenant: TenantStatisticsConfig;
  admin: AdminConfig;
  evaluation: EvaluationConfig;
  agentv2: AgentV2Config;
  agentv3: AgentV3Config;
  modelTraining: ModelTrainingConfig;
  telemetry: TelemetryConfig;
}

const rawS3ThumbnailBuckets = readConfig('s3-thumb-buckets', []);
const resolvedS3ThumbnailBuckets = Array.isArray(rawS3ThumbnailBuckets) ? rawS3ThumbnailBuckets.map((bucket) => normalizeS3ThumbnailBucketConfig(bucket as RawS3ThumbnailBucketConfig)) : [];

const port = readConfig('server.port', 3000);
const appUrl = readConfig('server.appUrl', `http://127.0.0.1:${port}`);

const logoConfig = readConfig('server.customization.logo', {
  light: 'https://monkeyminio01.daocloud.cn/monkeys/logo/InfMonkeys-logo-light.svg',
  dark: 'https://monkeyminio01.daocloud.cn/monkeys/logo/InfMonkeys-logo-dark.svg',
});
const faviconConfig = readConfig('server.customization.favicon', 'https://monkeyminio01.daocloud.cn/monkeys/logo/InfMonkeys-ICO.svg');

export const config: Config = {
  server: {
    port,
    appId: readConfig('server.appId', 'monkeys'),
    appUrl: appUrl,
    loadExample: readConfig('server.loadExample', true),
    rateLimit: {
      enabled: readConfig('server.rateLimit.enabled', false),
      windowMs: readConfig('server.rateLimit.windowMs', 1000),
      max: readConfig('server.rateLimit.max', 100),
    },
    customization: {
      id: readConfig('server.customization.id', 'default'),
      title: readConfig('server.customization.title', '猴子无限'),
      logo: typeof logoConfig === 'string' ? { light: logoConfig, dark: logoConfig } : logoConfig,
      favicon: typeof faviconConfig === 'string' ? { light: faviconConfig, dark: faviconConfig } : faviconConfig,
      background: readConfig('server.customization.background', undefined),
      colors: {
        primary: readConfig('server.customization.colors.primary', '#52ad1f'),
        neocard: readConfig('server.customization.colors.neocard', '#F1F5F9'),
        neocardDark: readConfig('server.customization.colors.neocardDark', '#1D1D1F'),
      },
      gradient: readConfig('server.customization.gradient', undefined),
      roundedSize: readConfig('server.customization.roundedSize', undefined),
      form: {
        variant: readConfig('server.customization.form.variant', 'bento'),
      },
      toast: {
        position: readConfig('server.customization.toast.position', 'bottom-right'),
      },
      icons: readConfig('server.customization.icons', {}),
      views: {
        form: {
          toast: {
            afterCreate: readConfig('server.customization.views.form.toast.afterCreate', true),
            afterDelete: readConfig('server.customization.views.form.toast.afterDelete', true),
          },
          progress: readConfig('server.customization.views.form.progress', 'infinite'),
          onlyResult: readConfig('server.customization.views.form.onlyResult', false),
          tabular: {
            theme: readConfig('server.customization.views.form.tabular.theme', 'default'),
          },
        },
      },
      extraLanguageURL: readConfig('server.customization.extraLanguageURL', {}),
      hideSpaceHeader: readConfig('server.customization.hideSpaceHeader', false),
      showSidebarTeamSelector: readConfig('server.customization.showSidebarTeamSelector', false),
      defaults: {
        showFormInImageDetail: readConfig('server.customization.defaults.showFormInImageDetail', true),
      },
      modules: {
        vinesSpaceSidebar: readConfig('server.customization.modules.vinesSpaceSidebar', '*'),
        vinesSpaceHeadbar: readConfig('server.customization.modules.vinesSpaceHeadbar', '*'),
        settingsSidebar: readConfig('server.customization.modules.settingsSidebar', '*'),
      },
      headbar: {
        navPosition: readConfig('server.customization.headbar.navPosition', 'left'),
        theme: readConfig('server.customization.headbar.theme', 'card'),
        actions: readConfig('server.customization.headbar.actions', '*'),
        profile: readConfig('server.customization.headbar.profile', '*'),
      },
      paginationPosition: readConfig('server.customization.paginationPosition', 'left'),
      ugcViewIconOnlyMode: readConfig('server.customization.ugcViewIconOnlyMode', false),
      workflowPreviewExecutionGrid: {
        selectionModeDisplayType: readConfig('server.customization.workflowPreviewExecutionGrid.selectionModeDisplayType', 'dropdown-menu'),
        clickBehavior: readConfig('server.customization.workflowPreviewExecutionGrid.clickBehavior', 'preview'),
        showErrorFilter: readConfig('server.customization.workflowPreviewExecutionGrid.showErrorFilter', true),
        displayType: readConfig('server.customization.workflowPreviewExecutionGrid.displayType', 'masonry'),
      },
      workbenchSidebarDefaultOpen: readConfig('server.customization.workbenchSidebarDefaultOpen', true),
      workbenchSidebarMoreAction: readConfig('server.customization.workbenchSidebarMoreAction', true),
      workbenchSidebarApart: readConfig('server.customization.workbenchSidebarApart', false),
      workbenchSidebarToggleGroupDetail: readConfig('server.customization.workbenchSidebarToggleGroupDetail', true),
      workbenchSidebarViewType: readConfig('server.customization.workbenchSidebarViewType', true),
      workbenchSidebarFormViewEmbed: readConfig('server.customization.workbenchSidebarFormViewEmbed', false),
      workbenchSidebarModernMode: readConfig('server.customization.workbenchSidebarModernMode', false),
      ugc: {
        onItemClick: readConfig('server.customization.ugc.onItemClick', true),
        subtitle: readConfig('server.customization.ugc.subtitle', true),
      },
      uniImagePreview: readConfig('server.customization.uniImagePreview', false),
      imagePreviewStyle: readConfig('server.customization.imagePreviewStyle', false),
      teamAsUser: readConfig('server.customization.teamAsUser', false),
      themeMode: readConfig('server.customization.themeMode', 'border'),
      density: readConfig('server.customization.density', 'default'),
      miniMode: {
        showPreviewViewExecutionResultGrid: readConfig('server.customization.miniMode.showPreviewViewExecutionResultGrid', true),
      },
      workflow: {
        allowConcurrentRuns: readConfig('server.customization.workflow.allowConcurrentRuns', true),
      },
      historyResult: {
        display: readConfig('server.customization.historyResult.display', true),
      },
      uploader: {
        orientation: readConfig('server.customization.uploader.orientation', 'horizontal'),
        pasteButton: readConfig('server.customization.uploader.pasteButton', true),
        statusText: readConfig('server.customization.uploader.statusText', true),
      },
      designProjects: {
        oneOnOne: readConfig('server.customization.designProjects.oneOnOne', true),
        newTabOpenBoard: readConfig('server.customization.designProjects.newTabOpenBoard', true),
        createDefaultFrame: readConfig('server.customization.designProjects.createDefaultFrame', true),
        showPageMenu: readConfig('server.customization.designProjects.showPageMenu', false),
        showMainMenu: readConfig('server.customization.designProjects.showMainMenu', false),
        showStylePanel: readConfig('server.customization.designProjects.showStylePanel', false),
        showToolbar: readConfig('server.customization.designProjects.showToolbar', false),
        showContextMenu: readConfig('server.customization.designProjects.showContextMenu', true),
        showPageAndLayerSidebar: readConfig('server.customization.designProjects.showPageAndLayerSidebar', false),
        showBoardOperationSidebar: readConfig('server.customization.designProjects.showBoardOperationSidebar', true),
        showActionsMenu: readConfig('server.customization.designProjects.showActionsMenu', true),
        showMiniToolsToolbar: readConfig('server.customization.designProjects.showMiniToolsToolbar', false),
        showRightSidebar: readConfig('server.customization.designProjects.showRightSidebar', false),
        showRealtimeDrawing: readConfig('server.customization.designProjects.showRealtimeDrawing', false),
        showWorkflow: readConfig('server.customization.designProjects.showWorkflow', false),
        showAgent: readConfig('server.customization.designProjects.showAgent', false),
      },
      marketplace: {
        presetAppSortFileUrl: readConfig('server.customization.marketplace.presetAppSortFileUrl', undefined),
        presetAppFileUrl: readConfig('server.customization.marketplace.presetAppFileUrl', undefined),
      },
      workbench: {
        pages: readConfig('server.customization.workbench.pages', []),
        pageGroups: readConfig('server.customization.workbench.pageGroups', []),
      },
      visionProWorkflows: readConfig('server.customization.visionProWorkflows', []),
    },
    webhook: {
      token: readConfig('server.webhook.token', undefined),
      backendBaseUrl: readConfig('server.webhook.backendBaseUrl', undefined),
      initTeam: readConfig('server.webhook.initTeam', undefined),
    },
    behavior: {
      clearWorkflowFormStorageAfterUpdate: readConfig('server.behavior.clearWorkflowFormStorageAfterUpdate', false),
    },
  },
  conductor: {
    baseUrl: readConfig('conductor.baseUrl', 'http://127.0.0.1:8080/api'),
    auth: readConfig('conductor.auth', null),
    polling: {
      interval: readConfig('conductor.polling.interval', 10),
      concurrency: readConfig('conductor.polling.concurrency', 10),
    },
    workerPrefix: readConfig('conductor.workerPrefix'),
  },
  database: readConfig('database', {
    type: 'better-sqlite3',
    database: 'data/db.sqlite',
    synchronize: false,
  }),
  redis: {
    mode: readConfig('redis.mode', RedisMode.standalone),
    // Standalone config
    url: readConfig('redis.url'),
    // Cluster config
    nodes: readConfig('redis.nodes', []),
    // Sentinel config
    sentinels: readConfig('redis.sentinels', []),
    sentinelName: readConfig('redis.sentinelName'),
    // Common config
    prefix: readConfig('redis.prefix', 'monkeys:'),
    options: readConfig('redis.options', {}),
  },
  tools: readConfig('tools', []),
  cron: {
    enabled: readConfig('cron.enabled', true),
  },
  comfyui: {
    defaultServer: readConfig('comfyui.defaultServer'),
    comfyfileRepo: readConfig('comfyui.comfyfileRepo', 'https://github.com/inf-monkeys/Comfyfile/tree/main/workflows'),
    githubToken: readConfig('comfyui.githubToken'),
    // Defaults to every 5 minutes
    refreshCron: readConfig('comfyui.refreshCron', '0 */5 * * * *'),
    apiToken: readConfig('comfyui.apiToken'),
    autodl: {
      token: readConfig('comfyui.autodl.token'),
      machineIds: readConfig('comfyui.autodl.machineIds', []),
    },
  },
  auth: {
    enabled: readConfig('auth.enabled', [AuthMethod.password, AuthMethod.apikey]),
    sessionSecret: readConfig('auth.sessionSecret', 'monkeys'),
    oidc: {
      auto_signin: readConfig('auth.oidc.auto_signin', false),
      issuer: readConfig('auth.oidc.issuer'),
      client_id: readConfig('auth.oidc.client_id'),
      client_secret: readConfig('auth.oidc.client_secret'),
      redirect_uri: readConfig('auth.oidc.redirect_uri', `${appUrl}/api/auth/oidc/callback`),
      post_logout_redirect_uri: readConfig('auth.oidc.post_logout_redirect_uri', appUrl),
      id_token_signed_response_alg: readConfig('auth.oidc.id_token_signed_response_alg', 'HS256'),
      token_endpoint_auth_method: readConfig('auth.oidc.token_endpoint_auth_method', 'client_secret_post'),
      scope: readConfig('auth.oidc.scope', 'openid profile'),
      grant_type: readConfig('auth.oidc.grant_type', 'authorization_code'),
      response_type: readConfig('auth.oidc.response_type', 'code'),
      button_text: readConfig('auth.oidc.button_text', 'OIDC'),
    },
    password: {
      saltTemplate: readConfig('auth.password.saltTemplate', '***monkeys***{{password}}***'),
    },
    jwt: {
      secret: readConfig('auth.jwt.secret', 'monkeys'),
      expires_in: readConfig('auth.jwt.expires_in', '30d'),
    },
    sms: {
      provider: 'dysms',
      config: readConfig('auth.sms.config', {}),
    },
    wework: {
      corpId: readConfig('auth.wework.corpId'),
      agentId: readConfig('auth.wework.agentId'),
      secret: readConfig('auth.wework.secret'),
      passwdSalt: readConfig('auth.wework.passwdSalt', '***monkeys-oauth*{{id}}*'),
    },
    feishu: {
      feishuApiUrl: readConfig('auth.feishu.feishuApiUrl', 'https://open.feishu.cn'),
      appId: readConfig('auth.feishu.appId'),
      appSecret: readConfig('auth.feishu.appSecret'),
    },
    saltTotp: readConfig('auth.saltTotp'),
    totpDigits: readConfig('auth.totpDigits', 8),
    totpAlgorithm: readConfig('auth.totpAlgorithm', 'SHA-512'),
    totpPeriod: readConfig('auth.totpPeriod', 120),
    privilegedToken: readConfig('auth.privilegedToken'),
    hideAuthToast: readConfig('auth.hideAuthToast', false),
    autoReload: readConfig('auth.autoReload', false),
    defaultOtherTeam: readConfig('auth.defaultOtherTeam', false),
  },
  admin: readConfig('admin'),
  s3: {
    proxy: readConfig('s3.proxy', true),
    randomFilename: readConfig('s3.randomFilename', false),
    autoGenerateThumbnail: readConfig('s3.autoGenerateThumbnail', false),
    isPrivate: readConfig('s3.isPrivate', false),
    forcePathStyle: readConfig('s3.forcePathStyle', false),
    endpoint: readConfig('s3.endpoint'),
    accessKeyId: readConfig('s3.accessKeyId'),
    secretAccessKey: readConfig('s3.secretAccessKey'),
    region: readConfig('s3.region'),
    bucket: readConfig('s3.bucket'),
    publicAccessUrl: readConfig('s3.publicAccessUrl'),
  },
  s3Thumbnail: {
    quality: readConfig('s3-thumbnail.quality', 80),
  },
  s3ThumbnailBuckets: resolvedS3ThumbnailBuckets,
  models: readConfig('models', []),
  proxy: {
    enabled: readConfig('proxy.enabled', false),
    url: readConfig('proxy.url'),
    exclude: readConfig('proxy.exclude', []),
  },
  llm: {
    toolResultMaxLength: readConfig('llm.tools.maxReultLength', 4096),
    templates: {
      knowledgeBase: readConfig(
        'llm.templates.knowledgeBase',
        `Use the following context as your learned knowledge, inside <context></context> XML tags.
<context>
{{#context#}}
</context>

When answer to user:
- If you don't know, just say that you don't know.
- If you don't know when you are not sure, ask for clarification.
- Avoid mentioning that you obtained the information from the context.
- And answer according to the language of the user's question.\n`,
      ),
      knowledgeBaseWithPresetPrompt: readConfig(
        'llm.templates.knowledgeBaseWithPresetPrompt',
        `{{#presetPrompt#}}

Use the following context as your learned knowledge, inside <context></context> XML tags.
<context>
{{#context#}}
</context>

When answer to user:
- If you don't know, just say that you don't know.
- If you don't know when you are not sure, ask for clarification.
- Avoid mentioning that you obtained the information from the context.
- And answer according to the language of the user's question.\n`,
      ),
    },
    maxRetries: readConfig('llm.maxRetries', 0),
    // Defaults to 30 minutes
    timeout: readConfig('llm.timeout', 1000 * 60 * 30),
  },
  paymentServer: {
    enabled: readConfig('paymentServer.enabled', false),
    baseUrl: readConfig('paymentServer.baseUrl'),
  },
  agentv3: {
    defaultModelId: readConfig('agentv3.defaultModelId', undefined),
    openai: {
      apiKey: readConfig('agentv3.openai.apiKey', process.env.OPENAI_API_KEY),
      models: readConfig('agentv3.openai.models', []),
    },
    openaiCompatible: {
      baseUrl: readConfig('agentv3.openaiCompatible.baseUrl', process.env.OPENAI_COMPATIBLE_BASE_URL),
      apiKey: readConfig('agentv3.openaiCompatible.apiKey', process.env.OPENAI_COMPATIBLE_API_KEY),
      models: readConfig('agentv3.openaiCompatible.models', []),
    },
    anthropic: {
      apiKey: readConfig('agentv3.anthropic.apiKey', process.env.ANTHROPIC_API_KEY),
      models: readConfig('agentv3.anthropic.models', []),
    },
    google: {
      apiKey: readConfig('agentv3.google.apiKey', process.env.GOOGLE_API_KEY),
      models: readConfig('agentv3.google.models', []),
    },
  },
  oneapi: {
    enabled: readConfig('oneapi.enabled', false),
    baseURL: readConfig('oneapi.baseURL'),
    rootToken: readConfig('oneapi.rootToken'),
    rootPassword: readConfig('oneapi.rootPassword'),
    rootUsername: readConfig('oneapi.rootUsername'),
  },
  aws: {
    translate: readConfig('aws.translate', {}),
  },
  tenant: {
    bearer: readConfig('tenant.bearer', ''),
  },
  evaluation: {
    defaultLlmEvaluatorModel: readConfig('evaluation.defaultLlmEvaluatorModel', ''),
  },
  agentv2: {
    openaiCompatible: {
      url: readConfig('agentv2.openaiCompatible.url', 'https://api.openai.com/v1'),
      apiKey: readConfig('agentv2.openaiCompatible.apiKey', ''),
      models: readConfig('agentv2.openaiCompatible.models', ['gpt-3.5-turbo', 'gpt-4']),
      webSearchModel: readConfig('agentv2.openaiCompatible.webSearchModel', 'gpt-4o-search-preview-2025-03-11'),
    },
    rateLimits: {
      perMinute: 60,
      perDay: 1000,
    },
    defaults: {
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 30000,
    },
    webSearch: {
      enabled: readConfig('agentv2.webSearch.enabled', true),
      maxTokensPerSearch: readConfig('agentv2.webSearch.maxTokensPerSearch', 2000),
      timeout: readConfig('agentv2.webSearch.timeout', 60000),
    },
  },
  modelTraining: {
    endpoint: readConfig('models-training.endpoint', 'http://localhost:30025'),
  },
  telemetry: {
    enabled: readConfig('telemetry.enabled', false),
    appDeployment: readConfig('telemetry.appDeployment', ''),
    appGroup: readConfig('telemetry.appGroup', ''),
    appName: readConfig('telemetry.appName', ''),
    appOwnerTeam: readConfig('telemetry.appOwnerTeam', ''),
    functionGroup: readConfig('telemetry.functionGroup', 'workflow'),
    loggingServiceUrl: readConfig('telemetry.loggingServiceUrl', ''),
    loggingApiKey: readConfig('telemetry.loggingApiKey', ''),
  },
};

export const isRedisConfigured = () => {
  if (config.redis.mode === RedisMode.standalone) {
    return !!config.redis.url;
  }
  if (config.redis.mode === RedisMode.cluster) {
    return !!config.redis.nodes.length;
  }
  if (config.redis.mode === RedisMode.sentinel) {
    return !!config.redis.sentinels.length && !!config.redis.sentinelName;
  }
  return false;
};

const validateConfig = () => {
  if (config.redis.mode === RedisMode.cluster && !config.redis.nodes.length) {
    throw new Error('Redis cluster mode requires at least one node');
  }
  if (config.redis.mode === RedisMode.sentinel) {
    if (!config.redis.sentinels.length) {
      throw new Error('Redis sentinel mode requires at least one sentinel node');
    }
    if (!config.redis.sentinelName) {
      throw new Error('Redis sentinel mode requires a sentinel name');
    }
  }
  if (config.proxy.enabled) {
    if (!config.proxy.url) {
      throw new Error('Proxy enabled but no url provided');
    }
    if (config.proxy.exclude && !Array.isArray(config.proxy.exclude)) {
      throw new Error('Proxy exclude must be an array');
    }
  }

  if (config.conductor.baseUrl) {
    if (!isValidUrl(config.conductor.baseUrl)) {
      throw new Error('Invalid conductor baseUrl: ' + config.conductor.baseUrl);
    }
  }

  if (config.oneapi.enabled) {
    if (!config.oneapi.baseURL) {
      throw new Error('OneAPI enabled but no baseURL provided');
    }
    if (!config.oneapi.rootToken && (!config.oneapi.rootUsername || !config.oneapi.rootPassword)) {
      throw new Error('OneAPI enabled but no rootToken or rootUsername/rootPassword provided');
    }

    if (config.oneapi.rootPassword) {
      config.oneapi.rootPassword = config.oneapi.rootPassword.toString();
    }

    if (config.oneapi.baseURL.endsWith('/')) {
      config.oneapi.baseURL = config.oneapi.baseURL.slice(0, -1);
    }
  }
};

validateConfig();

if (config.proxy.enabled) {
  const { url, exclude } = config.proxy;
  // Exclude localhost from proxy
  exclude.push('localhost');
  exclude.push('127.0.0.1');
  // Exclude condcutor from proxy
  exclude.push(getHostFromUrl(config.conductor.baseUrl));

  if (config.paymentServer.baseUrl) {
    exclude.push(getHostFromUrl(config.paymentServer.baseUrl));
  }
  if (config.oneapi.baseURL) {
    exclude.push(getHostFromUrl(config.oneapi.baseURL));
  }
  // Exlcude tools from proxy
  config.tools
    .filter((tool) => !tool.useProxy)
    .forEach((tool) => {
      if (tool.manifestUrl) {
        exclude.push(getHostFromUrl(tool.manifestUrl));
      }
    });
  process.env.HTTP_PROXY = url;
  process.env.HTTPS_PROXY = url;
  process.env.http_proxy = url;
  process.env.https_proxy = url;
  process.env.NO_PROXY = exclude.join(',');
}
