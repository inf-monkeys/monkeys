import { I18nValue, ToolProperty } from '@inf-monkeys/monkeys';

import { IBaseEntity } from '@/apis/typings.ts';

export interface ILLMModel extends IBaseEntity {
  uuid: string;
  origin: 'built-in' | 'user';
  teamId?: string;
  displayName: string | I18nValue;
  description: string | I18nValue;
  iconUrl: string;
  logo: string;
  models: { [x: string]: any };
  metadata: {
    properites: ToolProperty[];
    displayName: string | I18nValue;
    description: string | I18nValue;
    iconUrl: string;
    id: string;
  };
  channelId: number;
  channelType: string;
}

export interface ILLMChannel extends IBaseEntity {
  properites: ToolProperty[];
  displayName: string;
  iconUrl: string;
}
