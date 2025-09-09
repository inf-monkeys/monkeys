import useSWR, { preload } from 'swr';

import qs from 'qs';

import { IAgent } from '@/apis/agents/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem, IListUgcDto } from '@/apis/ugc/typings.ts';

import {
  IAgentV2,
  IAgentV2ConfigResponse,
  IAgentV2DetailResponse,
  IAgentV2ToolsConfigResponse,
  IAvailableModelsResponse,
  IAvailableToolsResponse,
  ICreateAgentV2Dto,
  IUpdateAgentV2ConfigDto,
  IUpdateAgentV2ToolsDto,
} from './typings';

// Data transformation functions
export const transformAgentV2ToAssetItem = (agentV2: IAgentV2): IAssetItem<IAgent> => {
  return {
    // Base IAssetItem fields
    id: agentV2.id,
    name: agentV2.name,
    description: agentV2.description,
    iconUrl: agentV2.iconUrl,
    teamId: agentV2.teamId,
    creatorUserId: agentV2.createdBy, // Map createdBy to creatorUserId
    isDeleted: agentV2.isDeleted,
    createdTimestamp: agentV2.createdTimestamp,
    updatedTimestamp: agentV2.updatedTimestamp,

    // IAgent fields extracted from config
    displayName: agentV2.name, // Use name as displayName
    model: agentV2.config.model,
    temperature: agentV2.config.temperature,
    // Note: Some IAgent fields are not available in AgentV2, so we omit them or use defaults
    // systemPrompt, knowledgeBase, sqlKnowledgeBase, tools, presence_penalty, frequency_penalty
    // will be undefined, which should be handled by the UI components
  } as unknown as IAssetItem<IAgent>;
};

export const transformAgentV2ListResponse = (
  response: any,
  page: number = 1,
  limit: number = 10,
): IPaginationListData<IAssetItem<IAgent>> => {
  // Handle both wrapped and direct response formats
  let agentsData;
  if (response?.success && response?.data) {
    // Wrapped format: {success: true, data: {agents: [], total: 2}}
    agentsData = response.data;
  } else if (response?.agents) {
    // Direct format: {agents: [], total: 2}
    agentsData = response;
  } else {
    return {
      page,
      limit,
      total: 0,
      data: [],
    };
  }

  return {
    page,
    limit,
    total: agentsData.total || 0,
    data: (agentsData.agents || []).map(transformAgentV2ToAssetItem),
  };
};

// Custom fetcher for Agent V2 with transformation
const agentV2Fetcher =
  (page: number = 1, limit: number = 10) =>
  (url: string) => {
    return vinesFetcher<any>()(url).then((response) => transformAgentV2ListResponse(response, page, limit));
  };

// Agent V2 API functions
export const useUgcAgentsV2 = (dto: IListUgcDto) => {
  const page = dto.page || 1;
  const limit = dto.limit || 10;

  const queryParams = qs.stringify(
    {
      page,
      limit,
      search: dto.search,
    },
    { encode: false },
  );

  const url = `/api/agent-v2?${queryParams}`;

  return useSWR<IPaginationListData<IAssetItem<IAgent>> | undefined>(url, agentV2Fetcher(page, limit));
};

export const preloadUgcAgentsV2 = (dto: IListUgcDto) => {
  const page = dto.page || 1;
  const limit = dto.limit || 10;

  const queryParams = qs.stringify(
    {
      page,
      limit,
      search: dto.search,
    },
    { encode: false },
  );

  const url = `/api/agent-v2?${queryParams}`;

  return preload(url, agentV2Fetcher(page, limit));
};

export const useGetAgentV2 = (agentId?: string | null) =>
  useSWR<IAssetItem<IAgent> | undefined>(agentId ? `/api/agent-v2/${agentId}` : null, (url) =>
    vinesFetcher<IAgentV2DetailResponse>()(url).then((response) => {
      if (!response || !response.success || !response.data) {
        return undefined;
      }
      return transformAgentV2ToAssetItem(response.data);
    }),
  );

// Get available models for Agent V2
export const useAvailableModelsV2 = () =>
  useSWR<IAvailableModelsResponse | undefined>('/api/agent-v2/available-models', (url) =>
    vinesFetcher<IAvailableModelsResponse>()(url),
  );

export const createAgentV2 = (agentParams: ICreateAgentV2Dto) => {
  return vinesFetcher<IAgentV2>({ method: 'POST', simple: true })('/api/agent-v2', agentParams).then((response) => {
    // With simple: true, vinesFetcher returns the data directly, not wrapped in {success, data}
    if (!response || !response.id) {
      throw new Error('Failed to create agent');
    }

    return transformAgentV2ToAssetItem(response);
  });
};

// Note: Agent V2 currently doesn't support delete operation
// We'll keep the existing delete function for now, but it won't work with V2 agents
export const deleteAgentV2 = (_agentId: string) => {
  // Agent V2 doesn't have delete endpoint yet
  throw new Error('Agent V2 delete operation is not yet supported');
};

export const updateAgentV2 = (_agentId: string, _agent: Partial<ICreateAgentV2Dto>) => {
  // Agent V2 doesn't have update endpoint yet
  throw new Error('Agent V2 update operation is not yet supported');
};

// Tool management APIs
export const useAvailableToolsV2 = () => {
  return useSWR<IAvailableToolsResponse | undefined>('/api/agent-v2/tools/available', (url) =>
    vinesFetcher<IAvailableToolsResponse>()(url),
  );
};

export const useAgentV2Tools = (agentId?: string) => {
  return useSWR<IAgentV2ToolsConfigResponse | undefined>(agentId ? `/api/agent-v2/${agentId}/tools` : null, (url) =>
    vinesFetcher<IAgentV2ToolsConfigResponse>()(url),
  );
};

export const updateAgentV2Tools = (agentId: string, dto: IUpdateAgentV2ToolsDto) => {
  return vinesFetcher<IAgentV2ToolsConfigResponse>({ method: 'PUT', simple: true })(
    `/api/agent-v2/${agentId}/tools`,
    dto,
  );
};

// Configuration management APIs
export const useAgentV2Config = (agentId?: string) => {
  return useSWR<IAgentV2ConfigResponse | undefined>(agentId ? `/api/agent-v2/${agentId}/config` : null, (url) =>
    vinesFetcher<IAgentV2ConfigResponse>()(url),
  );
};

export const updateAgentV2Config = (agentId: string, dto: IUpdateAgentV2ConfigDto) => {
  return vinesFetcher<IAgentV2ConfigResponse>({ method: 'PUT', simple: true })(`/api/agent-v2/${agentId}/config`, dto);
};
