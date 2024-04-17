import useSWR from 'swr';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IDatabaseData, IDatabaseTable, ITableData } from '@/apis/table-data/typings.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';

export const useDatabase = (databaseId?: string) =>
  useSWR<IPaginationListData<IAssetItem<ITableData>> | undefined>(
    databaseId
      ? `/api/sql-knowledge-bases${databaseId ? `?${qs.stringify({ filter: { ids: [databaseId] } }, { encode: false })}` : ''}`
      : null,
    vinesFetcher(),
  );

export const useDatabaseTables = (databaseId: string) =>
  useSWR<IDatabaseTable[] | undefined>(
    databaseId ? `/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/tables` : null,
    vinesFetcher({
      responseResolver: async (response) => {
        return ((await response.json()) as any).tables as IDatabaseTable[];
      },
    }),
  );

export const useDatabaseData = (databaseId: string, tableId: string, page = 1, limit = 10) =>
  useSWR<IDatabaseData[] | undefined>(
    databaseId && tableId
      ? `/api/sql-knowledge-bases/${databaseId}/tables/${tableId}?${qs.stringify({ page, limit })}`
      : null,
    vinesFetcher(),
  );

export const createDatabase = (parma: { displayName: string; description: string; iconUrl: string }) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/sql-knowledge-bases`, parma);

export const deleteDatabase = (databaseId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/sql-knowledge-bases/${databaseId}`);

export const deleteTable = (databaseId: string, tableId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/sql-knowledge-bases/${databaseId}/tables/${tableId}`);

export const importToDatabaseUseCSV = (databaseId: string, tableName: string, url: string) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/importFromCsv`, {
    tableName,
    url,
  });

export const createTableUseSQL = (databaseId: string, sql: string) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/tables`, {
    sql,
  });
