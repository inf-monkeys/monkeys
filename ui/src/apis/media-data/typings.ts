import { I18nValue } from '@inf-monkeys/monkeys';

import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IVinesDataset } from '@/apis/dataset/typings.ts';

export interface IMediaDataCategory {
  id: string;
  teamId: string;
  userId: string;
  name: string;
  count: number;
  isPreset: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}

export enum IMediaDataSource {
  UPLOAD = 1,
  AIGC_INFER = 2,
  AUTO_GENERATE = 3,
}

export type IMediaDataImageParams = {
  width: number;
  height: number;
} & Record<string, unknown>;
export type IMediaDataOrDataset = IMediaData | IVinesDataset;

export type IMediaDataType = 'image' | 'text' | 'dataset';

export interface IMediaData {
  id: string;
  type: IMediaDataType;
  md5?: string;
  size?: number;
  teamId: string;
  userId: string;
  displayName: string | I18nValue;
  url: string;
  tags: string[];
  categoryIds: string[];
  source: IMediaDataSource;
  params?: IMediaDataImageParams;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  user?: Partial<IVinesUser>;
}
