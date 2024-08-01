import useSWR from 'swr';

import { IAgent } from '@/apis/agents/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const createAgent = (agentParams: IAgent) =>
  vinesFetcher<IAssetItem<IAgent>>({ method: 'POST', simple: true })('/api/conversation-apps', agentParams);

export const useGetAgent = (agentId?: string | null) =>
  useSWR<IAssetItem<IAgent> | undefined>(agentId ? `/api/conversation-apps/${agentId}` : null, vinesFetcher());

export const deleteAgent = (agentId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/conversation-apps/${agentId}`);

export const updateAgent = (agentId: string, agent: Partial<IAgent>) =>
  vinesFetcher<IAssetItem<IAgent>, Partial<IAssetItem<IAgent>>>({ method: 'PUT', simple: true })(
    `/api/conversation-apps/${agentId}`,
    agent,
  );
