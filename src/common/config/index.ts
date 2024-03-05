import { readConfig } from './readYaml';

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
}

export interface DatabaseConfig {
  type: 'mongodb';
  url: string;
}

export interface RedisConfig {
  enabled: boolean;
  url: string;
}

export interface Config {
  server: ServerConfig;
  conductor: ConductorConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
}

const port = readConfig('server.port', 3000);

export const config: Config = {
  server: {
    port,
    appId: readConfig('server.appId', 'monkeys'),
    appUrl: readConfig('server.appUrl', `http://localhost:${port}`),
    loadExample: readConfig('server.loadExample', true),
  },
  conductor: {
    baseUrl: readConfig('conductor.baseUrl', 'http://localhost:8080/api'),
    auth: readConfig('conductor.auth', null),
    polling: {
      interval: readConfig('conductor.polling.interval', 100),
      concurrency: readConfig('conductor.polling.concurrency', 20),
    },
    workerPrefix: readConfig('conductor.workerPrefix'),
  },
  database: {
    type: 'mongodb',
    url: readConfig('database.url', 'mongodb://localhost:27017'),
  },
  redis: {
    enabled: readConfig('redis.enabled', false),
    url: readConfig('redis.url', 'redis://localhost:6379'),
  },
};
