import useSWR, { preload } from 'swr';

import { AssetType, MonkeyWorkflow } from '@inf-monkeys/vines';
import _ from 'lodash';
import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMModel } from '@/apis/llm/typings.ts';
import { IMediaData } from '@/apis/media-data/typings.ts';
import { ISDModel } from '@/apis/sd/typings.ts';
import { ITableData } from '@/apis/table-data/typings.ts';
import { IWorkflowBlock } from '@/apis/tools/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IApplicationStoreItemDetail } from '@/apis/ugc/asset-typings.ts';
import { IKnowledgeBaseFrontEnd } from '@/apis/vector/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';

import { IAssetItem, IAssetTag, IListUgcDto, IUgcFilterRules } from './typings';

export const useUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${qs.stringify(dto, { encode: false })}` : url;
  const fetcher =
    method === 'GET'
      ? vinesFetcher({ wrapper: paginationWrapper })
      : vinesFetcher({
          method,
          simple: true,
          wrapper: paginationWrapper,
        });
  return useSWR<IPaginationListData<IAssetItem<T>> | undefined>(method === 'GET' ? swrUrl : [swrUrl, dto], fetcher);
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const preloadUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${qs.stringify(dto, { encode: false })}` : url;
  const fetcher =
    method === 'GET'
      ? vinesFetcher({ wrapper: paginationWrapper })
      : vinesFetcher({
          method,
          simple: true,
          wrapper: paginationWrapper,
        });
  return preload(method === 'GET' ? swrUrl : [swrUrl, dto], fetcher);
};

export const useUgcWorkflows = (dto: IListUgcDto) => useUgcItems<MonkeyWorkflow>(dto, '/api/workflow/metadata');
export const preloadUgcWorkflows = (dto: IListUgcDto) => preloadUgcItems<MonkeyWorkflow>(dto, '/api/workflow/metadata');

export const useUgcActionTools = (dto: IListUgcDto) => useUgcItems<IWorkflowBlock>(dto, '/api/tools');
export const preloadUgcActionTools = (dto: IListUgcDto) => preloadUgcItems<IWorkflowBlock>(dto, '/api/tools');

export const useUgcTextModels = (dto: IListUgcDto) => useUgcItems<ILLMModel>(dto, '/api/llm/models');
export const preloadUgcTextModels = (dto: IListUgcDto) => preloadUgcItems<ILLMModel>(dto, '/api/llm/models');

export const useUgcImageModels = (dto: IListUgcDto) => useUgcItems<ISDModel>(dto, '/api/sd/models');
export const preloadUgcImageModels = (dto: IListUgcDto) => preloadUgcItems<ISDModel>(dto, '/api/sd/models');

export const useUgcKnowledgeBases = (dto: IListUgcDto) =>
  useUgcItems<IKnowledgeBaseFrontEnd>(dto, '/api/knowledge-bases');

export const preloadKnowledgeBases = (dto: IListUgcDto) =>
  preloadUgcItems<IKnowledgeBaseFrontEnd>(dto, '/api/knowledge-bases');

export const useUgcTableData = (dto: IListUgcDto) => useUgcItems<ITableData>(dto, '/api/database');
export const preloadUgcTableData = (dto: IListUgcDto) => preloadUgcItems<ITableData>(dto, '/api/database');

export const useUgcMediaData = (dto: IListUgcDto) => useUgcItems<IMediaData>(dto, '/api/resources/list', 'POST');
export const preloadUgcMediaData = (dto: IListUgcDto) =>
  preloadUgcItems<IMediaData>(dto, '/api/resources/list', 'POST');

export const useUgcApplicationStore = (dto: IListUgcDto) =>
  useUgcItems<IApplicationStoreItemDetail>(dto, '/api/templates');
export const preloadUgcApplicationStore = (dto: IListUgcDto) =>
  preloadUgcItems<IApplicationStoreItemDetail>(dto, '/api/templates');

export const useUgcTextModelStore = (dto: IListUgcDto) => useUgcItems<ILLMModel>(dto, '/api/llm/models/public');
export const preloadUgcTextModelStore = (dto: IListUgcDto) => preloadUgcItems<ILLMModel>(dto, '/api/llm/models/public');

export const useUgcImageModelStore = (dto: IListUgcDto) => useUgcItems<ISDModel>(dto, '/api/sd/models/public');
export const preloadUgcImageModelStore = (dto: IListUgcDto) => preloadUgcItems<ISDModel>(dto, '/api/sd/models/public');

export const useAssetTagList = () =>
  useSWR<IAssetTag[] | undefined>(`/api/assets/tags`, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const useAssetFilterRuleList = (type: AssetType) =>
  useSWR<IUgcFilterRules[] | undefined>(`/api/assets/filters?type=${type}`, vinesFetcher(), {
    refreshInterval: 600000,
  });

export const createAssetFilterRules = (name: string, rules: Partial<IListUgcDto['filter']>, type: AssetType) => {
  return vinesFetcher<IUgcFilterRules>({ method: 'POST', simple: true })('/api/assets/filters', { name, rules, type });
};
export const removeAssetFilterRules = (id: string) => {
  return vinesFetcher<boolean>({ method: 'DELETE' })(`/api/assets/filters/${id}`);
};

export const createTag = (name: string) => {
  return vinesFetcher<IAssetTag>({ method: 'POST', simple: true })(`/api/assets/tags/`, { name });
};

export const updateAssetTag = (type: AssetType, id: string, data: any) =>
  vinesFetcher({
    method: 'PUT',
    simple: true,
  })(
    `/api/assets/${type}/${id}/tags`,
    _.pickBy(data, (v) => !_.isNil(v)),
  );

export const useSearchReferenceWorkflows = (assetType?: AssetType, assetId?: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(
    assetId && assetType ? `/api/assets/reference/workflow?assetType=${assetType}&assetId=${assetId}` : null,
    vinesFetcher(),
    {
      refreshInterval: 600000,
    },
  );
