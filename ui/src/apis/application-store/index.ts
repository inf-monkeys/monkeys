import { MonkeyWorkflow } from '@inf-monkeys/vines';

import { vinesFetcher } from '@/apis/fetcher.ts';

export const forkApplicationFromTemplate = (id: string) =>
  vinesFetcher<MonkeyWorkflow>({
    method: 'POST',
    simple: true,
  })(`/api/workflow/metadata/${id}/clone`);
