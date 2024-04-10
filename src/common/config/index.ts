import { ClientAuthMethod } from 'openid-client';
import { DataSourceOptions } from 'typeorm';
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
    windowMs: number;
    max: number;
  };
}

export interface RedisConfig {
  url: string;
  prefix: string;
}

export interface VectorGatewayService {
  enabled: boolean;
  baseUrl: string;
}

export interface ToolServiceConfig {
  name: string;
  manifestUrl?: string;
  baseUrl?: string;
}

export interface CronConfig {
  enabled: boolean;
}

export interface ComfyUICofig {
  baseUrl: string;
}

export enum AuthMethod {
  password = 'password',
  phone = 'phone',
  oidc = 'oidc',
  apikey = 'apikey',
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

export interface AuthConfig {
  enabled: AuthMethod[];
  sessionSecret?: string;
  oidc?: OIDCIdpConfig;
  password?: PasswordConfig;
  jwt: JwtConfig;
  sms: SMSConfig;
}

export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  publicAccessUrl: string;
}

export interface Config {
  server: ServerConfig;
  conductor: ConductorConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  vector: VectorGatewayService;
  tools: ToolServiceConfig[];
  cron: CronConfig;
  comfyui: ComfyUICofig;
  auth: AuthConfig;
  s3: S3Config;
}

const port = readConfig('server.port', 3000);
const appUrl = readConfig('server.appUrl', `http://127.0.0.1:${port}`);

export const config: Config = {
  server: {
    port,
    appId: readConfig('server.appId', 'monkeys'),
    appUrl: appUrl,
    loadExample: readConfig('server.loadExample', true),
    rateLimit: {
      windowMs: readConfig('server.rateLimit.windowMs', 1000),
      max: readConfig('server.rateLimit.max', 100),
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
    synchronize: true,
  }),
  redis: {
    url: readConfig('redis.url'),
    prefix: readConfig('redis.prefix', 'monkeys:'),
  },
  vector: {
    enabled: readConfig('vector.enabled', false),
    baseUrl: readConfig('vector.baseUrl', 'http://localhost:8899'),
  },
  tools: readConfig('tools', []),
  cron: {
    enabled: readConfig('cron.enabled', true),
  },
  comfyui: {
    baseUrl: readConfig('comfyui.baseUrl', 'http://127.0.0.1:8188'),
  },
  auth: {
    enabled: readConfig('auth.enabled', []),
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
  },
  s3: readConfig('s3', {}),
};
