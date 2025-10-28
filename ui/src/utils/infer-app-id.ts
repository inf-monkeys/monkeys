import { AssetType, I18nValue, MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IWorkflowAssociationType } from '@/apis/workflow/association/typings';

import { getI18nContent } from '.';

export const inferAppId = ({
  displayName,
  assetType,
  scope,
  type,
  workflowId,
  originWorkflow,
  targetWorkflow,
}: {
  displayName: string | I18nValue;
  assetType: AssetType | 'page-group';
  scope?: 'specific' | 'global';
  type?: IWorkflowAssociationType;
  workflowId?: string;
  originWorkflow?: MonkeyWorkflow;
  targetWorkflow?: MonkeyWorkflow;
}) => {
  let enDisplayName = '';

  if (assetType === 'workflow') {
    enDisplayName = getI18nContent(displayName, '', 'en') ?? '';
  } else if (assetType === 'workflow-association') {
    if (scope === 'specific' && workflowId) {
      if (type === 'to-workflow') {
        enDisplayName =
          getI18nContent(originWorkflow?.displayName, '', 'en') +
          '-to-' +
          getI18nContent(targetWorkflow?.displayName, '', 'en');
      } else {
        enDisplayName = getI18nContent(originWorkflow?.displayName, '', 'en') + '-to-board';
      }
    } else if (scope === 'global') {
      if (type === 'to-workflow') {
        enDisplayName = 'global-to-' + getI18nContent(targetWorkflow?.displayName, '', 'en');
      } else {
        enDisplayName = 'global-to-board';
      }
    }
  } else if (assetType === 'design-association') {
    enDisplayName = 'to-' + getI18nContent(displayName, '', 'en');
  } else if (assetType === 'page-group') {
    enDisplayName = getI18nContent(displayName, '', 'en') ?? '';
  }

  const namePart = enDisplayName
    ?.toLowerCase()
    .replace(/[\s_\-.,，。？！!?:;；、~`'"“”‘’()[\]{}<>@#$%^&*+=\\/|]/g, '-');
  const appId = `${namePart}-${assetType}`;
  return appId;
};
