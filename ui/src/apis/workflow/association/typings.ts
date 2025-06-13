import { I18nValue } from '@inf-monkeys/monkeys';

import { IBaseEntity } from '@/apis/typings';

export type IWorkflowAssociation = {
  enabled: boolean;
  displayName?: I18nValue | string | null;
  description?: I18nValue | string | null;
  iconUrl?: string;
  sortIndex?: number | null;
  originWorkflowId: string;
  targetWorkflowId: string;
  mapper: {
    origin: string;
    target: string;
    default?: any;
  }[];
} & IBaseEntity;
