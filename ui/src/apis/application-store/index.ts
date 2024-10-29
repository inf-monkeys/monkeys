import { MonkeyWorkflow } from '@inf-monkeys/monkeys';
import { AssetType } from '@inf-monkeys/monkeys';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const forkApplicationFromTemplate = (id: string) =>
  vinesFetcher<MonkeyWorkflow>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/metadata/${id}/clone`);

export const publishApplication = (id: string, assetType: AssetType) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/${assetType}/publish/${id}`);
