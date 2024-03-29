import useSWR, { preload } from 'swr';

import { AssetType, MonkeyWorkflow } from '@inf-monkeys/vines';
import _ from 'lodash';
import queryString from 'query-string';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';

import { IAssetItem, IListUgcDto } from './typings';

export const useUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${queryString.stringify(dto)}` : url;
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
export const preloadUgcItems = <T extends object>(dto: IListUgcDto, url: string, method: 'GET' | 'POST' = 'GET') => {
  const swrUrl = method === 'GET' ? `${url}?${queryString.stringify(dto)}` : url;
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

export const useAssetTagList = (assetKey?: string) =>
  useSWR<string[] | undefined>(assetKey ? `/api/assets/${assetKey}/tags` : null, vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const updateAssetItem = (type: AssetType, id: string, data: any) =>
  vinesFetcher({
    method: 'PUT',
    simple: true,
  })(
    `/api/assets/${type}/${id}`,
    _.pickBy(data, (v) => !_.isNil(v)),
  );
