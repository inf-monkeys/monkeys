import React, { useEffect, useMemo, useState } from 'react';

import { AssetType, ToolCategory } from '@inf-monkeys/monkeys';
import {
  ColumnDef,
  createColumnHelper,
  functionalUpdate,
  getCoreRowModel,
  PaginationState,
  Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import _, { isNull } from 'lodash';
import { CircleSlash, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IWorkflowTool } from '@/apis/tools/typings.ts';
import { IAssetItem, IListUgcDto, IListUgcItemsFnType, IPreloadUgcItemsFnType } from '@/apis/ugc/typings.ts';
import { UgcSidebar } from '@/components/layout/ugc/sidebar';
import {
  IDefaultPageSizeStorage,
  IDisplayModeStorage,
  IOperateAreaProps,
  ISortCondition,
  ISortConditionStorage,
  IUgcRenderOptions,
} from '@/components/layout/ugc/typings.ts';
import { UgcViewCard } from '@/components/layout/ugc/view/card';
import { UgcViewGalleryItem } from '@/components/layout/ugc/view/gallery';
import { UgcViewHeader } from '@/components/layout/ugc/view/header';
import { DEFAULT_SORT_CONDITION } from '@/components/layout/ugc/view/header/consts.ts';
import { RenderTags } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { RemoteDataTable } from '@/components/ui/data-table/remote.tsx';
import { VinesFullLoading } from '@/components/ui/loading';
import { TablePagination } from '@/components/ui/pagination/table-pagination.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getI18nContent } from '@/utils';

interface IUgcViewProps<E extends object> {
  assetKey: string;
  assetName: string;
  assetType: AssetType;
  isLoadAll?: boolean;
  isMarket?: boolean;
  useUgcFetcher: IListUgcItemsFnType<E>;
  preloadUgcFetcher: IPreloadUgcItemsFnType<E>;
  createColumns: () => ColumnDef<IAssetItem<E>, any>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: IOperateAreaProps<E>;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  subtitle?: React.ReactNode;
  defaultPageSize?: number;
  assetIdKey?: string;
}

export const UgcView = <E extends object>({
  assetKey,
  assetName,
  assetType,
  isLoadAll = false,
  isMarket = false,
  useUgcFetcher,
  preloadUgcFetcher,
  createColumns,
  renderOptions,
  operateArea,
  onItemClick,
  subtitle,
  defaultPageSize = 24,
  assetIdKey = 'id',
}: IUgcViewProps<E>): React.ReactNode => {
  const { t } = useTranslation();

  const team = useVinesTeam();

  // local storage
  const [displayModeStorage] = useLocalStorage<IDisplayModeStorage>(`vines-ui-asset-display-mode`, {});
  const displayMode = useMemo(
    () => (!team || !assetKey ? null : _.get(displayModeStorage, [team.teamId, assetKey], 'card')),
    [displayModeStorage, team.teamId, assetKey],
  );

  const [sortConditionStorage] = useLocalStorage<ISortConditionStorage>(`vines-ui-asset-sort-condition`, {});
  const sortCondition: ISortCondition = useMemo(
    () => _.get(sortConditionStorage, [team.teamId, assetKey], DEFAULT_SORT_CONDITION),
    [sortConditionStorage, team.teamId, assetKey],
  );

  const [defaultPageSizeStorage, setDefaultPageSizeStorage] = useLocalStorage<IDefaultPageSizeStorage>(
    `vines-ui-asset-default-page-size`,
    {},
  );
  const defaultPageSizeLS = useMemo(
    () => (!team || !assetKey ? null : _.get(defaultPageSizeStorage, [team.teamId, assetKey], defaultPageSize)),
    [defaultPageSizeStorage, team.teamId, assetKey, defaultPageSize],
  );

  // state
  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: defaultPageSizeLS ?? defaultPageSize,
    pageIndex: 0,
  });

  useEffect(() => {
    defaultPageSizeLS &&
      setPagination((prev) => {
        return {
          ...prev,
          pageSize: isLoadAll ? 1000 : defaultPageSizeLS,
        };
      });
  }, [defaultPageSizeLS]);

  // filter
  const [filter, setFilter] = useState<Partial<IListUgcDto['filter']>>({});

  // fetch data
  const {
    data: rawData,
    isLoading,
    mutate,
  } = useUgcFetcher({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    filter,
    orderBy: sortCondition.orderBy,
    orderColumn: sortCondition.orderColumn,
  });

  const data = useMemo(() => {
    const result =
      rawData && _.isArray(rawData.data)
        ? assetType === 'tools' && filter.cate
          ? rawData.data.filter((l) =>
              filter.cate
                ? (l as unknown as IAssetItem<IWorkflowTool>)?.categories?.includes(filter.cate as ToolCategory)
                : true,
            )
          : rawData.data
        : [];

    return result.map((it) => {
      const { description, displayName } = it as IAssetItem<E> & { displayName?: string };

      return {
        ...it,
        ...(description && { description: getI18nContent(description) }),
        ...(displayName && { displayName: getI18nContent(displayName) }),
      };
    });
  }, [rawData, filter]);
  const pageData = useMemo(
    () =>
      rawData
        ? _.pick(rawData, ['total', 'limit', 'page'])
        : {
            total: 0,
            limit: pagination.pageSize,
            page: 1,
          },
    [rawData],
  );

  const handlePreload = (pageIndex: number) =>
    preloadUgcFetcher({
      page: pageIndex,
      limit: pagination.pageSize,
      filter: {},
    });

  // 单独写是为了存储 pageSize
  const onPaginationChange = (updater: Updater<PaginationState>) => {
    setPagination((old) => {
      const newVal = functionalUpdate(updater, old);
      setDefaultPageSizeStorage((prev) => {
        return {
          ...prev,
          [team.teamId]: {
            ...prev[team.teamId],
            [assetKey]: newVal.pageSize,
          },
        };
      });
      return newVal;
    });
  };

  const columnHelper = createColumnHelper<IAssetItem<E>>();
  const columns = useMemo(() => {
    const cols = createColumns();

    // 添加 header
    cols.forEach((col, index) => {
      if (!col.header) {
        cols[index].header = t(`ugc-page.${assetKey}.ugc-view.columns.${col.id}.label`);
      }
    });

    // 修改 tag 列
    const tagColumn = cols.find((c) => c.id === 'assetTags');
    if (tagColumn) {
      const index = cols.indexOf(tagColumn);
      cols[index] = {
        ...tagColumn,
        cell: ({ row }) =>
          RenderTags({
            assetType,
            assetId: row.original[assetIdKey],
            assetTags: row.original.assetTags,
            mutate,
          }),
      };
    }
    // 添加操作列
    if (operateArea && !cols.find((c) => c.id === 'operate')) {
      cols.push(
        columnHelper.display({
          id: 'operate',
          size: 24,
          header: t('common.utils.operate'),
          cell: ({ row }) =>
            operateArea(row.original, <Button icon={<MoreHorizontal />} size="small" />, t('common.utils.operate')),
        }),
      );
    }

    return cols;
  }, [assetKey, assetType, assetIdKey, operateArea, mutate, columnHelper]);

  // 使用 tanstack table 管理状态
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
    },
    manualPagination: true,
    rowCount: pageData.total,
    onPaginationChange,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="flex size-full">
      <UgcSidebar
        title={assetName}
        assetKey={assetKey}
        assetType={assetType}
        isMarket={isMarket}
        filterListProps={{
          onChange: setFilter,
          filterButtonProps: {
            filter,
            onChange: setFilter,
          },
        }}
      />
      <div className="relative w-full flex-1 overflow-x-clip">
        <UgcViewHeader
          assetKey={assetKey}
          assetType={assetType}
          isMarket={isMarket}
          subtitle={subtitle}
          filterButtonProps={{
            filter,
            onChange: setFilter,
          }}
        />
        <div className="relative overflow-hidden">
          <AnimatePresence>
            {(isLoading || isNull(displayMode)) && <VinesFullLoading motionKey={`vines-assets-${assetKey}-loading`} />}
          </AnimatePresence>
          <div className="flex flex-col">
            <ScrollArea className="relative h-[calc(100vh-9.5rem)] w-full rounded-r-lg px-4 py-2">
              {rows.length === 0 ? (
                !isLoading && (
                  <motion.div
                    className="vines-center size-full h-[calc(100vh-12rem)] flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.3 } }}
                  >
                    <CircleSlash size={64} />
                    <div className="mt-4 flex flex-col text-center">
                      <h2 className="font-bold">{t('common.load.empty')}</h2>
                    </div>
                  </motion.div>
                )
              ) : (
                <>
                  {displayMode === 'card' && (
                    <div className="grid w-full grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {rows.map((row, index) => (
                        <UgcViewCard
                          row={row}
                          key={row.original['id']}
                          index={index}
                          columns={columns}
                          renderOptions={renderOptions}
                          operateArea={operateArea}
                          onItemClick={onItemClick}
                        />
                      ))}
                    </div>
                  )}
                  {displayMode === 'table' && (
                    <RemoteDataTable
                      columns={columns}
                      data={data}
                      onPaginationChange={table.setPagination}
                      rowCount={table.getRowCount()}
                      state={table.getState()}
                      showPagination={false}
                    />
                  )}
                  {displayMode === 'gallery' && (
                    <div className="flex flex-wrap gap-4">
                      {rows.map((row, index) => (
                        <UgcViewGalleryItem
                          row={row}
                          columns={columns}
                          key={row.original['id']}
                          index={index}
                          renderOptions={renderOptions}
                          operateArea={operateArea}
                          onItemClick={onItemClick}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </ScrollArea>
            <TablePagination
              className="py-0"
              pagination={table.getState().pagination}
              onPaginationChange={table.setPagination}
              rowCount={table.getRowCount()}
              preloadHover={handlePreload}
              isLoadAll={isLoadAll}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
