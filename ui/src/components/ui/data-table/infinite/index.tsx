import React, { lazy, Suspense } from 'react';

import { ColumnDef, TableState } from '@tanstack/react-table';

import { Skeleton } from '@/components/ui/skeleton.tsx';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IInfiniteScrollingDataTableProps<TData, TValue> {
  className?: string;

  columns: ColumnDef<unknown, unknown>[];
  data: TData[];
  state?: Partial<TableState>;

  increaseViewportBy?: number;
  loadMore?: () => void;
  loading?: boolean;

  tfoot?: React.ReactNode;
}

const InfiniteScrollingDataTableCore = lazy(() => import('./core.tsx'));

export function InfiniteScrollingDataTable<TData, TValue>(props: IInfiniteScrollingDataTableProps<TData, TValue>) {
  return (
    <Suspense fallback={<Skeleton className="min-h-32 w-full" />}>
      <InfiniteScrollingDataTableCore {...props} />
    </Suspense>
  );
}
