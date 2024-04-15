import useSWR from 'swr';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { ISDModel, ISDModelsParams } from '@/apis/sd/typings.ts';

export const useSDModels = (query: ISDModelsParams) =>
  useSWR<ISDModel[] | undefined>(`/api/sd/models?${qs.stringify(query)}`, vinesFetcher());

export const useBuiltInModels = () => useSWR<ISDModel[] | undefined>('/api/sd/models/built-in', vinesFetcher());
