import React, { useState } from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  OnChangeFn,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { TablePagination } from '@/components/ui/pagination/table-pagination.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface IRemoteDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowCount: number;
  state: {
    pagination: PaginationState;
  };
  onPaginationChange: OnChangeFn<PaginationState>;
  preloadHover?: (pageIndex: number, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  showPagination?: boolean;
}

export function RemoteDataTable<TData, TValue>({
  columns,
  data,
  state,
  onPaginationChange,
  rowCount,
  preloadHover,
  showPagination = true,
}: IRemoteDataTableProps<TData, TValue>) {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    onPaginationChange,
    rowCount,
    state: {
      sorting,
      ...state,
    },
  });

  const { rows } = table.getRowModel();
  const hastData = rows.length > 0;

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="h-64 overflow-y-auto">
            {hastData ? (
              rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('common.load.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className="w-full py-2">
          <TablePagination
            rowCount={rowCount}
            pagination={state.pagination}
            onPaginationChange={onPaginationChange}
            preloadHover={preloadHover}
          />
        </div>
      )}
    </div>
  );
}
