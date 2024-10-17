import React, { lazy, Suspense } from 'react';

import type { ColumnDef } from '@tanstack/react-table';

import { Skeleton } from '@/components/ui/skeleton.tsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IDataTableProps<TData, TValue> {
  columns: ColumnDef<unknown, unknown>[];
  data: TData[];
  enablePagination?: boolean;
  defaultPageSize?: number;
}

const DataTableCore = lazy(() => import('./core.tsx'));

export const DataTable = <TData, TValue>(props: IDataTableProps<TData, TValue>) => (
  <Suspense fallback={<Skeleton className="min-h-32 w-full" />}>
    <DataTableCore {...props} />
  </Suspense>
);
