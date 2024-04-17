import { IBaseEntity } from '@/apis/typings.ts';

export interface ITableData extends IBaseEntity {
  uuid: string;
  displayName: string;
  description: string;
  iconUrl?: string;
  teamId: string;
  creatorUserId: string;
}

export interface IDatabaseTable extends IBaseEntity {
  name: string;
  sql: string;
}

export type IDatabaseData = { id: number } & Record<string, string>;
