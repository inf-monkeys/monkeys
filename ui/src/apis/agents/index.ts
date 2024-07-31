import { IAgent } from '@/apis/agents/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const createAgent = (agentParams: IAgent) =>
  vinesFetcher<IAssetItem<IAgent>>({ method: 'POST', simple: true })('/api/conversation-apps', agentParams);
export const deleteAgent = (agentId: string) =>
  vinesFetcher({
    method: 'DELETE',
  })(`/api/conversation-apps/${agentId}`);
