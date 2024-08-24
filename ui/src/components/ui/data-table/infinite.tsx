import React, { useState } from 'react';

import { ColumnDef, getCoreRowModel, getSortedRowModel, TableState, useReactTable } from '@tanstack/react-table';
import { useThrottleEffect } from 'ahooks';
import { CircleSlash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VirtuaInfiniteTable } from '@/components/ui/data-table/virtua';
import { VinesLoading } from '@/components/ui/loading';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { cn } from '@/utils';

interface IInfiniteScrollingDataTableProps<TData, TValue> {
  className?: string;

  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  state?: Partial<TableState>;

  loading?: boolean;

  tfoot?: React.ReactNode;
}

export function InfiniteScrollingDataTable<TData, TValue>({
  className,

  columns,
  data,
  state,

  loading,

  tfoot,
}: IInfiniteScrollingDataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const table = useReactTable({
    data,
    columns,
    state,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();
  const hastData = rows.length > 0;

  const { ref, height: wrapperHeight } = useElementSize();
  const [height, setHeight] = useState(500);
  useThrottleEffect(
    () => {
      if (!wrapperHeight) return;
      setHeight(wrapperHeight - 42);
    },
    [wrapperHeight],
    { wait: 64 },
  );

  return (
    <div ref={ref} className={cn('relative overflow-auto rounded-md border', className)}>
      {hastData ? (
        <VirtuaInfiniteTable table={table} rows={rows} height={height} tfoot={tfoot} />
      ) : (
        <div className="vines-center size-full flex-col gap-4">
          {loading ? (
            <>
              <VinesLoading />
            </>
          ) : (
            <CircleSlash size={64} />
          )}

          <h1>{loading ? t('common.load.loading') : t('common.load.empty')}</h1>
        </div>
      )}
    </div>
  );
}
