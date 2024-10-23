import React, { lazy, Suspense } from 'react';

import { ColumnDef, OnChangeFn, PaginationState } from '@tanstack/react-table';

import { Skeleton } from '@/components/ui/skeleton.tsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IRemoteDataTableProps<TData, TValue> {
  columns: ColumnDef<unknown, unknown>[];
  data: TData[];
  rowCount: number;
  state: {
    pagination: PaginationState;
  };
  onPaginationChange: OnChangeFn<PaginationState>;
  preloadHover?: (pageIndex: number, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  showPagination?: boolean;
}

const RemoteDataTableCore = lazy(() => import('./data-table-remote.tsx'));

export function RemoteDataTable<TData, TValue>(props: IRemoteDataTableProps<TData, TValue>) {
  return (
    <Suspense fallback={<Skeleton className="min-h-32 w-full" />}>
      <RemoteDataTableCore {...props} />
    </Suspense>
  );
}
