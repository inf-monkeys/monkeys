import useSWR, { preload } from 'swr';

import { AssetType, MonkeyWorkflow } from '@inf-monkeys/vines';
import _ from 'lodash';
import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ILLMModel } from '@/apis/llm/typings.ts';
import { ISDModel } from '@/apis/sd/typings.ts';
import { ITableData } from '@/apis/table-data/typings.ts';
import { IWorkflowBlock } from '@/apis/tools/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IVectorFrontEnd } from '@/apis/vector/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';

import { IAssetItem, IListUgcDto, IUgcFilterRules } from './typings';

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

export const useUgcWorkflows = (dto: IListUgcDto) => useUgcItems<MonkeyWorkflow>(dto, '/api/workflow/list');
export const preloadUgcWorkflows = (dto: IListUgcDto) => preloadUgcItems<MonkeyWorkflow>(dto, '/api/workflow/list');

export const useUgcActionTools = (dto: IListUgcDto) => useUgcItems<IWorkflowBlock>(dto, '/api/blocks/list');
export const preloadUgcActionTools = (dto: IListUgcDto) => preloadUgcItems<IWorkflowBlock>(dto, '/api/blocks/list');

export const useUgcTextModels = (dto: IListUgcDto) => useUgcItems<ILLMModel>(dto, '/api/llm/models');
export const preloadUgcTextModels = (dto: IListUgcDto) => preloadUgcItems<ILLMModel>(dto, '/api/llm/models');

export const useUgcImageModels = (dto: IListUgcDto) => useUgcItems<ISDModel>(dto, '/api/sd/models');
export const preloadUgcImageModels = (dto: IListUgcDto) => preloadUgcItems<ISDModel>(dto, '/api/sd/models');

export const useUgcVectors = (dto: IListUgcDto) => useUgcItems<IVectorFrontEnd>(dto, '/api/vector/collections');
export const preloadUgcVectors = (dto: IListUgcDto) => preloadUgcItems<IVectorFrontEnd>(dto, '/api/vector/collections');

export const useUgcTableData = (dto: IListUgcDto) => useUgcItems<ITableData>(dto, '/api/database');
export const preloadUgcTableData = (dto: IListUgcDto) => preloadUgcItems<ITableData>(dto, '/api/database');

export const useAssetTagList = (assetKey?: string) =>
  useSWR<string[] | undefined>(assetKey ? `/api/assets/${assetKey}/tags` : null, vinesFetcher(), {
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

export const updateAssetItem = (type: AssetType, id: string, data: any) =>
  vinesFetcher({
    method: 'PUT',
    simple: true,
  })(
    `/api/assets/${type}/${id}`,
    _.pickBy(data, (v) => !_.isNil(v)),
  );

export const useSearchReferenceWorkflows = (assetType?: AssetType, assetId?: string) =>
  useSWR<MonkeyWorkflow[] | undefined>(
    assetId && assetType ? `/api/assets/reference?assetType=${assetType}&assetId=${assetId}` : null,
    vinesFetcher(),
    {
      refreshInterval: 600000,
    },
  );
