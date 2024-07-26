import React from 'react';

import { OnChangeFn, PaginationState } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

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
import { usePagination } from '@/hooks/use-pagination.ts';
import { cn } from '@/utils';

export interface ITablePaginationProps {
  rowCount: number;
  pagination: {
    pageSize: number;
    pageIndex: number;
  };
  onPaginationChange: OnChangeFn<PaginationState>;
  preloadHover?: (pageIndex: number, e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  className?: string;
  isLoadAll?: boolean;
}

export const TablePagination: React.FC<ITablePaginationProps> = ({
  rowCount,
  pagination,
  onPaginationChange,
  preloadHover,
  className,
  isLoadAll = false,
}) => {
  const { t } = useTranslation();
  const total = Math.ceil(rowCount / pagination.pageSize);
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
    <div className={cn('flex h-[36px] justify-between py-1', className)}>
      <div className="ml-4 flex items-center gap-2 text-nowrap">
        <span>
          {t('components.ui.pagination.table-pagination.hint.count', { count: rowCount })}
          {!isLoadAll &&
            '  ' +
              t('components.ui.pagination.table-pagination.hint.page-index', { pageIndex: paginationState.active })}
        </span>
        {!isLoadAll && (
          <>
            <span>{'  ' + t('components.ui.pagination.table-pagination.hint.page-size')}</span>
            <Select
              value={pagination.pageSize.toString()}
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
                  <SelectLabel>{t('components.ui.pagination.table-pagination.page-size')}</SelectLabel>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      {!isLoadAll && (
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
                disabled={paginationState.active === total || total === 0}
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
      )}
    </div>
  );
};
