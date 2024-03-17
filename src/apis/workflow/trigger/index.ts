import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ITriggerType, IUpdateTriggerParams, IVinesTrigger } from '@/apis/workflow/trigger/typings.ts';

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

export const useTriggerUpdate = (workflowId?: string, triggerId?: string) =>
  useSWRMutation<ITriggerType | undefined, unknown, string | null, IUpdateTriggerParams>(
    workflowId && triggerId ? `/api/workflow/${workflowId}/triggers/${triggerId}` : null,
    vinesFetcher({ method: 'PUT' }),
  );

export const useTriggerRemove = (workflowId?: string, triggerId?: string) =>
  useSWRMutation<ITriggerType | undefined, unknown, string | null>(
    workflowId && triggerId ? `/api/workflow/${workflowId}/triggers/${triggerId}` : null,
    vinesFetcher({ method: 'DELETE' }),
  );
