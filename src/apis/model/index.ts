import useSWR from 'swr';

import queryString from 'query-string';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ISDModel, ISDModelsParams } from '@/apis/model/typings.ts';

export const useSDModels = (query: ISDModelsParams) =>
  useSWR<ISDModel[] | undefined>(`/api/sd/models?${queryString.stringify(query)}`, vinesFetcher());

export const useBuiltInModels = () => useSWR<ISDModel[] | undefined>('/api/sd/models/built-in', vinesFetcher());
