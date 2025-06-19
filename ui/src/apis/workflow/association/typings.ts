import { I18nValue } from '@inf-monkeys/monkeys';

import { IBaseEntity } from '@/apis/typings';

type IBaseWorkflowAssociation = {
  enabled: boolean;
  displayName?: I18nValue | string | null;
  description?: I18nValue | string | null;
  iconUrl?: string;
  sortIndex?: number | null;
  originWorkflowId: string;
  type: IWorkflowAssociationType;
} & IBaseEntity;

export type IWorkflowAssociationType = 'to-workflow' | 'new-design';

type IToWorkflowWorkflowAssociation = {
  type: 'to-workflow';
  targetWorkflowId: string;
  mapper: {
    origin: string;
    target: string;
    default?: any;
  }[];
} & IBaseWorkflowAssociation;

type INewDesignWorkflowAssociation = {
  type: 'new-design';
} & IBaseWorkflowAssociation;

export type IWorkflowAssociation = IToWorkflowWorkflowAssociation | INewDesignWorkflowAssociation;

export type IUpdateAndCreateWorkflowAssociation =
  | Pick<
      IToWorkflowWorkflowAssociation,
      'displayName' | 'description' | 'enabled' | 'mapper' | 'targetWorkflowId' | 'iconUrl' | 'sortIndex' | 'type'
    >
  | Pick<INewDesignWorkflowAssociation, 'displayName' | 'description' | 'enabled' | 'iconUrl' | 'sortIndex' | 'type'>;
