import { configure, getLogger, Logger } from 'log4js';
import { config } from '../config';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const appId = config.server.appId;

const dateFileRollingOptions = {
  alwaysIncludePattern: true,
  daysToKeep: 30,
  keepFileExt: true,
};

configure({
  appenders: {
    stdout: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: `[%d{ISO8601_WITH_TZ_OFFSET}] %p %c [${appId}] %f:%l  %m`,
      },
    },
    file: {
      type: 'dateFile',
      filename: `${appId}-server.log`,
      layout: {
        type: 'pattern',
        pattern: `[%d{ISO8601_WITH_TZ_OFFSET}] %p %c [${appId}] %f:%l  %m`,
      },
      pattern: '.yyyy-MM-dd',
      ...dateFileRollingOptions,
    },
  },
  categories: { default: { appenders: ['stdout'], level: 'ALL' } },
});

export const logger: Logger = getLogger('default');
