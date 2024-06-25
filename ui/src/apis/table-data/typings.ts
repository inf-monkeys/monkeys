import { I18nValue } from '@inf-monkeys/monkeys';

import { IBaseEntity } from '@/apis/typings.ts';

export enum SqlKnowledgeBaseCreateType {
  builtIn = 'builtIn',
  external = 'external',
}

export interface ITableData extends IBaseEntity {
  uuid: string;
  displayName: string | I18nValue;
  description: string | I18nValue;
  iconUrl?: string;
  teamId: string;
  creatorUserId: string;
  createType: SqlKnowledgeBaseCreateType;
}

export interface IDatabaseTable extends IBaseEntity {
  name: string;
  sql: string;
}

export type IDatabaseData = { id: number } & Record<string, string>;

export interface ExternalSqlDatabaseConnectionOptions {
  host?: string;
  port?: string;
  username?: string;
  password?: string;
  database?: string;
  schema?: string;
}

export interface CreateSqlKnowledgeBaseParams {
  createType: string;
  externalDatabaseType?: string;
  externalDatabaseConnectionOptions?: ExternalSqlDatabaseConnectionOptions;
  displayName?: string;
  description?: string;
  iconUrl?: string;
}
