import React, { forwardRef, SetStateAction, useContext, useEffect, useRef } from 'react';

import { flexRender } from '@tanstack/react-table';
import { HeaderGroup } from '@tanstack/table-core';
import { throttle } from 'lodash';
import { CustomContainerComponentProps } from 'virtua';

import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { mergeRefs } from '@/utils/merge-refs.ts';

export const VirtuaTableWrapperContext = React.createContext<HeaderGroup<any>[]>([]);
export const WidthContext = React.createContext<{
  widths: number[];
  setWidths: React.Dispatch<SetStateAction<number[]>>;
} | null>(null);

export const VirtuaTableWrapper = forwardRef<HTMLTableElement, CustomContainerComponentProps>(
  ({ children, style }, ref) => {
    const groups = useContext(VirtuaTableWrapperContext);
    const tableElemRef = useRef<HTMLTableElement>(null);

    const { setWidths } = useContext(WidthContext)!;

    useEffect(() => {
      const callback = throttle(() => {
        callback.cancel();
        const widths: number[] = [];
        groups
          .flatMap((it) => it.headers.map((header) => header.id))
          .forEach((id) => {
            const elem = tableElemRef.current?.querySelector(`[data-id="${id}"]`);
            if (elem) {
              widths.push((elem as HTMLElement).offsetWidth);
            }
          });
        setWidths(widths);
      }, 100);
      const widthObserver = new ResizeObserver(callback);
      if (tableElemRef.current) {
        widthObserver.observe(tableElemRef.current);
      }

      return () => {
        callback.cancel();
        widthObserver.disconnect();
      };
    }, []);

    return (
      <Table ref={mergeRefs([ref, tableElemRef])} style={{ height: style?.height }}>
        <TableHeader className="invisible flex h-0">
          {groups.map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }} data-id={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody style={style}>{children}</TableBody>
      </Table>
    );
  },
);
VirtuaTableWrapper.displayName = 'VirtuaTableWrapper';
