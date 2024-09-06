import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { IComfyuiServer } from '@/apis/comfyui/typings.ts';
import { IBaseEntity } from '@/apis/typings.ts';

export interface IComfyuiModelType extends IBaseEntity {
  teamId: string;
  creatorUserId: string;
  displayName: string;
  description?: string;
  iconUrl: string;
  tags: string[];
  creator?: Partial<IVinesUser>;
  name: string;
  path: string;
}

export interface IComfyuiServerRelation {
  server: IComfyuiServer;
  type?: IComfyuiModelType[];
  path: string;
  filename: string;
}

export interface IComfyuiModel extends IBaseEntity {
  teamId: string;
  creatorUserId: string;
  displayName: string;
  description?: string;
  iconUrl: string;
  tags: string[];
  creator?: Partial<IVinesUser>;
  sha256: string;
  serverRelations: IComfyuiServerRelation[];
}

interface IComfyuiServerRelationWithApiPath extends IComfyuiServerRelation {
  apiPath: string;
}

export interface IComfyuiModelWithApiPath extends IComfyuiModel {
  serverRelations: IComfyuiServerRelationWithApiPath[];
}

export type IComfyuiModelWithOneServerWithApiPath = Omit<IComfyuiModel, 'serverRelations'> & {
  serverRelation: IComfyuiServerRelationWithApiPath;
};
