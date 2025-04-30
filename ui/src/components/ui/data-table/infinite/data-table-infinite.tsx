import React from 'react';

import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { CircleSlash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TableVirtuoso } from 'react-virtuoso';

import { IInfiniteScrollingDataTableProps } from '@/components/ui/data-table/infinite/index.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { TableCell, TableHead, TableRow } from '@/components/ui/table.tsx';
import { cn } from '@/utils';

function InfiniteScrollingDataTable<TData, TValue>({
  className,

  columns,
  data,
  state,

  increaseViewportBy = 200,
  loadMore,
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

  return (
    <div className={cn('relative overflow-auto rounded-md border', className)}>
      {hastData ? (
        <TableVirtuoso
          data={rows}
          components={{
            Table: ({ children, ...props }) => (
              <table className="w-full caption-bottom text-sm [&>thead]:bg-slate-1" {...props}>
                {children}
                {tfoot}
              </table>
            ),
            TableRow: TableRow,
          }}
          endReached={loadMore}
          increaseViewportBy={increaseViewportBy}
          fixedHeaderContent={() =>
            table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))
          }
          itemContent={(_index, row) =>
            row
              .getVisibleCells()
              .map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))
          }
        />
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

export default InfiniteScrollingDataTable;
