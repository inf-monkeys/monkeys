import { AssetType, MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IApplicationPublishConfig, IAutoPinPage } from '@/apis/application-store/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const forkApplicationFromTemplate = (id: string, autoPinPage?: IAutoPinPage) =>
  vinesFetcher<Pick<MonkeyWorkflow, 'workflowId'>>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/metadata/${id}/clone`, autoPinPage ? { autoPinPage } : undefined);

export const createShortcutsFlowWithWorkflowId = (workflowId: string) =>
  vinesFetcher<Pick<MonkeyWorkflow, 'workflowId'>>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/metadata/${workflowId}/create-shortcut`);

export const publishApplication = (id: string, assetType: AssetType, publishConfig: IApplicationPublishConfig) =>
  vinesFetcher<MonkeyWorkflow, { publishConfig: IApplicationPublishConfig }>({
    method: 'POST',
    simple: true,
  })(`/api/assets/${assetType}/publish/${id}`, { publishConfig });

export const deleteApplicationOnStore = (id: string, assetType: AssetType) =>
  vinesFetcher({
    method: 'DELETE',
    simple: true,
  })(`/api/assets/${assetType}/publish/${id}`);
