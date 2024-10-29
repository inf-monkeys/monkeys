import { AssetType, MonkeyWorkflow } from '@inf-monkeys/monkeys';

import { IApplicationPublishConfig } from '@/apis/application-store/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const forkApplicationFromTemplate = (id: string) =>
  vinesFetcher<MonkeyWorkflow>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/metadata/${id}/clone`);

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
