import useSWR from 'swr';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IDatabaseData, IDatabaseTable, ITableData } from '@/apis/table-data/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const useDatabase = (databaseId?: string) =>
  useSWR<IPaginationListData<IAssetItem<ITableData>> | undefined>(
    databaseId
      ? `/api/database${databaseId ? `?${qs.stringify({ filter: { ids: [databaseId] } }, { encode: false })}` : ''}`
      : null,
    vinesFetcher(),
  );

export const useDatabaseTables = (databaseId: string) =>
  useSWR<IDatabaseTable[] | undefined>(databaseId ? `/api/database/${databaseId}/tables` : null, vinesFetcher());

export const useDatabaseData = (databaseId: string, tableId: string, page = 1, limit = 10) =>
  useSWR<IDatabaseData[] | undefined>(
    databaseId && tableId ? `/api/database/${databaseId}/tables/${tableId}?${qs.stringify({ page, limit })}` : null,
    vinesFetcher(),
  );

export const createDatabase = (parma: { name: string; description: string; iconUrl: string }) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/database`, parma);

export const deleteDatabase = (databaseId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/database/${databaseId}`);

export const deleteTable = (databaseId: string, tableId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/database/${databaseId}/tables/${tableId}`);

export const importToDatabaseUseCSV = (databaseId: string, tableName: string, url: string) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/database/${databaseId}/importFromCsv`, {
    tableName,
    url,
  });

export const createTableUseSQL = (databaseId: string, tableName: string, sql: string) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/database/${databaseId}/tables`, {
    tableName,
    sql,
  });
