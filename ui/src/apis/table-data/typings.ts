import { IBaseEntity } from '@/apis/typings.ts';

export interface ITableData extends IBaseEntity {
  _id: string;
  name: string;
  description: string;
  iconUrl?: string;
  teamId: string;
  creatorUserId: string;
}
