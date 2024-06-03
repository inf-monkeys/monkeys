import useSWR from 'swr';

import qs from 'qs';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { CreateSqlKnowledgeBaseParams, IDatabaseData, IDatabaseTable, ITableData } from '@/apis/table-data/typings.ts';

export const useDatabase = (databaseId?: string) =>
  useSWR<ITableData | undefined>(databaseId ? `/api/sql-knowledge-bases/${databaseId}` : null, vinesFetcher());

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
      ? `/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/tables/${tableId}?${qs.stringify({ page, limit })}`
      : null,
    vinesFetcher({
      responseResolver: async (response) => {
        return ((await response.json()) as any).records as IDatabaseData[];
      },
    }),
  );

export const createDatabase = (parma: CreateSqlKnowledgeBaseParams) =>
  vinesFetcher({ method: 'POST', simple: true })(`/api/sql-knowledge-bases`, parma);

export const deleteDatabase = (databaseId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(`/api/sql-knowledge-bases/${databaseId}`);

export const deleteTable = (databaseId: string, tableId: string) =>
  vinesFetcher({ method: 'DELETE', simple: true })(
    `/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/tables/${tableId}`,
  );

export const importToDatabaseUseCSV = (databaseId: string, table_name: string, csvfile: string, sep = ',') =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/csvs`, {
    table_name,
    csvfile,
    sep,
  });

export const createTableUseSQL = (databaseId: string, sql: string) =>
  vinesFetcher({
    method: 'POST',
    simple: true,
  })(`/api/tools/monkey_tools_knowledge_base/sql-knowledge-bases/${databaseId}/tables`, {
    sql,
  });
