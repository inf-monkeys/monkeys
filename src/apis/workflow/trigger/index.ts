import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ITriggerType, IVinesTrigger } from '@/apis/workflow/trigger/typings.ts';

export const useTriggers = (workflowId?: string, version = 1, apikey?: string) =>
  useSWR<IVinesTrigger[] | undefined>(
    workflowId ? `/api/workflow/${workflowId}/triggers?version=${version}` : null,
    vinesFetcher({ apikey }),
  );

export const useTriggerTypes = (apikey?: string) =>
  useSWR<ITriggerType[] | undefined>('/api/workflow/trigger-types', vinesFetcher({ apikey }), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });
