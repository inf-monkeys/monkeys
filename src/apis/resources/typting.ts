import { IVinesUser } from '@/apis/authz/user/typings.ts';

export interface IMd5Response {
  id: string;
  assetType: string;
  teamId: string;
  creatorUserId: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  iconUrl: string;
  name: string;
  description: string;
  isDeleted: boolean;
  type: string;
  url: string;
  source: number;
  size: number;
  params: {
    width: number;
    height: number;
  };
  md5: string;
}

export enum VinesResourceSource {
  UPLOAD = 1,
  AIGC_INFER = 2,
  AUTO_GENERATE = 3,
}

export type VinesResourceImageParams = {
  width: number;
  height: number;
} & Record<string, unknown>;

export type VinesResourceType = 'image' | 'text' | 'dataset';

export interface IVinesResource {
  id: string;
  type: VinesResourceType;
  md5?: string;
  size?: number;
  teamId: string;
  userId: string;
  name: string;
  url: string;
  tags: string[];
  categoryIds: string[];
  source: VinesResourceSource;
  params?: VinesResourceImageParams;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
  user?: Partial<IVinesUser>;
}
