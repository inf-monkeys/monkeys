import React, { Fragment, useRef, useState } from 'react';

import { flexRender, Row } from '@tanstack/react-table';
import { Table } from '@tanstack/table-core';
import { Virtualizer } from 'virtua';

import {
  VirtuaTableWrapper,
  VirtuaTableWrapperContext,
  WidthContext,
} from '@/components/ui/data-table/virtua/table-wrapper.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';

interface IVirtuaInfiniteTableProps {
  table: Table<any>;

  rows?: Row<any>[];

  height: number;
  tfoot?: React.ReactNode;
}

export const VirtuaInfiniteTable: React.FC<IVirtuaInfiniteTableProps> = ({ table, rows: propRows, height, tfoot }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [widths, setWidths] = useState<number[]>([]);

  const rows = propRows || table.getRowModel().rows;

  const headerGroups = table.getHeaderGroups();

  return (
    <WidthContext.Provider value={{ widths, setWidths }}>
      <VirtuaTableWrapperContext.Provider value={headerGroups}>
        <TableHeader>
          {headerGroups.map((headerGroup) => (
            <TableRow className="block" key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead className="text-sm" key={header.id} style={{ width: header.getSize() }} data-id={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <ScrollArea ref={scrollRef} style={{ height }} disabledOverflowMask>
          <Virtualizer as={VirtuaTableWrapper} scrollRef={scrollRef} item={TableRow as any}>
            {rows.map((row, i) => (
              <Fragment key={i}>
                {row.getVisibleCells().map((cell, i) => (
                  <TableCell key={cell.id} style={{ minWidth: widths[i] }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </Fragment>
            ))}
          </Virtualizer>
          {tfoot}
        </ScrollArea>
      </VirtuaTableWrapperContext.Provider>
    </WidthContext.Provider>
  );
};
