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
    title: string;
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
    };
    toast: {
      position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
    };
    hideSpaceHeader?: boolean;
    showSidebarTeamSelector?: boolean;
    showSidebarPageGroup?: boolean;
  };
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
}

export interface S3Config {
  proxy: boolean;
  isPrivate: boolean;
  forcePathStyle: boolean;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  publicAccessUrl: string;
}

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

export interface TenantStaticsConfig {
  bearerToken: string;
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
  models: LlmModelConfig[];
  proxy: ProxyConfig;
  llm: LLmConfig;
  paymentServer: PaymentServerConfig;
  oneapi: OneApiConfig;
  aws: AwsConfig;
  tenantStatics: TenantStaticsConfig;
}

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
      title: readConfig('server.customization.title', '猴子无限'),
      logo: typeof logoConfig === 'string' ? { light: logoConfig, dark: logoConfig } : logoConfig,
      favicon: typeof faviconConfig === 'string' ? { light: faviconConfig, dark: faviconConfig } : faviconConfig,
      colors: {
        primary: readConfig('server.customization.colors.primary', '#52ad1f'),
      },
      toast: {
        position: readConfig('server.customization.toast.position', 'bottom-right'),
      },
      hideSpaceHeader: readConfig('server.customization.hideSpaceHeader', false),
      showSidebarPageGroup: readConfig('server.customization.showSidebarPageGroup', true),
      showSidebarTeamSelector: readConfig('server.customization.showSidebarTeamSelector', false),
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
  },
  s3: {
    proxy: readConfig('s3.proxy', true),
    isPrivate: readConfig('s3.isPrivate', false),
    forcePathStyle: readConfig('s3.forcePathStyle', false),
    endpoint: readConfig('s3.endpoint'),
    accessKeyId: readConfig('s3.accessKeyId'),
    secretAccessKey: readConfig('s3.secretAccessKey'),
    region: readConfig('s3.region'),
    bucket: readConfig('s3.bucket'),
    publicAccessUrl: readConfig('s3.publicAccessUrl'),
  },
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
  tenantStatics: {
    bearerToken: readConfig('tenantStatics.bearerToken', ''),
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
