import useSWR from 'swr';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IDatabaseData, IDatabaseTable, ITableData } from '@/apis/table-data/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const useDatabase = (databaseId?: string) =>
  useSWR<IPaginationListData<IAssetItem<ITableData>> | undefined>(
    `/api/database${databaseId ? `?${qs.stringify({ filter: { ids: [databaseId] } }, { encode: false })}` : ''}`,
    vinesFetcher(),
  );

export const useDatabaseTables = (databaseId: string) =>
  useSWR<IDatabaseTable[] | undefined>(`/api/database/${databaseId}/tables`, vinesFetcher());

export const useDatabaseData = (databaseId: string, tableId: string, page = 1, limit = 10) =>
  useSWR<IDatabaseData[] | undefined>(
    `/api/database/${databaseId}/tables/${tableId}?${qs.stringify({ page, limit })}`,
    vinesFetcher(),
  );
