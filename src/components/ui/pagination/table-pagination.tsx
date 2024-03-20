import React from 'react';

import { usePagination } from '@mantine/hooks';
import { OnChangeFn, PaginationState } from '@tanstack/react-table';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination/index.tsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';

export interface ITablePaginationProps {
  rowCount: number;
  pagination: {
    pageSize: number;
    pageIndex: number;
  };
  onPaginationChange: OnChangeFn<PaginationState>;
  preloadHover?: (pageIndex: number, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

export const TablePagination: React.FC<ITablePaginationProps> = ({
  rowCount,
  pagination,
  onPaginationChange,
  preloadHover,
}) => {
  const total = Math.round(rowCount / pagination.pageSize);
  const paginationState = usePagination({
    total,
    page: pagination.pageIndex + 1,
    onChange: (page) => {
      onPaginationChange((prev) => {
        return {
          ...prev,
          pageIndex: page - 1,
        };
      });
    },
  });
  return (
    <div className="flex justify-between py-1">
      <div className="ml-4 flex items-center gap-2 text-nowrap">
        <span>{`共 ${rowCount} 条，第 ${paginationState.active} 页，`}每页</span>
        <Select
          defaultValue={pagination.pageSize.toString()}
          onValueChange={(v) =>
            onPaginationChange((prev) => {
              return {
                ...prev,
                pageSize: parseInt(v),
              };
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="选择" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>每页最大条目数</SelectLabel>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <span>条</span>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={paginationState.active === 1}
              onClick={() => paginationState.previous()}
              onMouseOver={
                preloadHover && paginationState.active != 1
                  ? (e) => {
                      preloadHover(paginationState.active, e);
                    }
                  : undefined
              }
            />
          </PaginationItem>
          {paginationState.range.map((item, index) =>
            item === 'dots' ? (
              <PaginationItem key={index}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={index}>
                <PaginationLink
                  isActive={item === paginationState.active}
                  onClick={() => paginationState.setPage(item)}
                  onMouseOver={
                    preloadHover
                      ? (e) => {
                          preloadHover(item + 1, e);
                        }
                      : undefined
                  }
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              disabled={paginationState.active === total}
              onClick={() => paginationState.next()}
              onMouseOver={
                preloadHover && paginationState.active != total
                  ? (e) => {
                      preloadHover(paginationState.active + 2, e);
                    }
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
