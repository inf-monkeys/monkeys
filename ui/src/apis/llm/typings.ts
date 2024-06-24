import { IBaseEntity } from '@/apis/typings.ts';
import { BlockDefProperties } from '@inf-monkeys/vines';

export interface ILLMModel extends IBaseEntity {
  uuid: string;
  origin: 'built-in' | 'user';
  teamId?: string;
  displayName: string;
  description: string;
  logo: string;
  models: { [x: string]: any };
  channelId: number;
  channelType: string;
}

export interface ILLMChannel extends IBaseEntity {
  properites: BlockDefProperties[];
  displayName: string;
  iconUrl: string;
}
