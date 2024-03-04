import { configure, getLogger, Logger } from 'log4js';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

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
        pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] %p %c %f:%l  %m',
      },
    },
    file: {
      type: 'dateFile',
      filename: 'monkeys-server.log',
      layout: {
        type: 'pattern',
        pattern: '[%d{ISO8601_WITH_TZ_OFFSET}] %p %c %f:%l  %m',
      },
      pattern: '.yyyy-MM-dd',
      ...dateFileRollingOptions,
    },
  },
  categories: { default: { appenders: ['stdout', 'file'], level: 'info' } },
});

export const logger: Logger = getLogger('default');
