import React, { useCallback, useEffect, useMemo, useState } from 'react';

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
import { useDebounceEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import _, { get, isNull } from 'lodash';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomizationUgc } from '@/apis/common/typings';
import { ICommonTool, IWorkflowTool } from '@/apis/tools/typings.ts';
import { useAssetFilterRuleList, useUgcMediaDataForFolderView, IFolderViewData } from '@/apis/ugc';
import { IAssetItem, IListUgcDto, IListUgcItemsFnType, IPreloadUgcItemsFnType } from '@/apis/ugc/typings.ts';
import { UgcSidebar } from '@/components/layout/ugc/sidebar';
import {
  IDefaultPageSizeStorage,
  IDisplayModeStorage,
  IOperateAreaProps,
  ISortCondition,
  IUgcRenderOptions,
} from '@/components/layout/ugc/typings.ts';
import { UgcViewCard } from '@/components/layout/ugc/view/card';
import { UgcViewFolderView } from '@/components/layout/ugc/view/folder-view';
import { UgcViewGalleryItem } from '@/components/layout/ugc/view/gallery';
import { UgcViewHeader } from '@/components/layout/ugc/view/header';
import { RenderTags } from '@/components/layout/ugc/view/utils/renderer.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { RemoteDataTable } from '@/components/ui/data-table/remote';
import { Empty } from '@/components/ui/empty';
import { VinesFullLoading } from '@/components/ui/loading';
import { TablePagination } from '@/components/ui/pagination/table-pagination.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage';
import useUrlState from '@/hooks/use-url-state';
import { useMediaDataStore } from '@/store/useMediaDataStore';
import { cn, getI18nContent } from '@/utils';

import { DefaultTitleCell } from '../consts-cell';

interface IUgcViewProps<E extends object> {
  assetKey: string;
  assetName: string;
  assetType: AssetType;
  isLoadAll?: boolean;
  showPagination?: boolean;
  isMarket?: boolean;
  useUgcFetcher: IListUgcItemsFnType<E>;
  preloadUgcFetcher?: IPreloadUgcItemsFnType;
  createColumns: () => ColumnDef<IAssetItem<E>, any>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: IOperateAreaProps<E>;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  subtitle?: React.ReactNode;
  defaultPageSize?: number;
  assetIdKey?: string;
  showSearch?: boolean;
}

export const UgcView = <E extends object>({
  assetKey,
  assetName,
  assetType,
  isLoadAll = false,
  showPagination = true,
  isMarket = false,
  useUgcFetcher,
  preloadUgcFetcher,
  createColumns,
  renderOptions,
  operateArea,
  onItemClick: onItemClickProp,
  subtitle: subtitleProp,
  defaultPageSize = 24,
  assetIdKey = 'id',
  showSearch,
}: IUgcViewProps<E>): React.ReactNode => {
  const { t } = useTranslation();

  const team = useVinesTeam();

  // local storage
  const [displayModeStorage, setDisplayModeStorage] = useLocalStorage<IDisplayModeStorage>(
    `vines-ui-asset-display-mode`,
    {},
  );
  const displayMode = useMemo(
    () => (!team || !assetKey ? null : _.get(displayModeStorage, [team.teamId, assetKey], 'card')),
    [displayModeStorage, team.teamId, assetKey],
  );

  const [defaultPageSizeStorage, setDefaultPageSizeStorage] = useLocalStorage<IDefaultPageSizeStorage>(
    `vines-ui-asset-default-page-size`,
    {},
  );
  const defaultPageSizeLS = useMemo(
    () => (!team || !assetKey ? null : _.get(defaultPageSizeStorage, [team.teamId, assetKey], defaultPageSize)),
    [defaultPageSizeStorage, team.teamId, assetKey, defaultPageSize],
  );

  // 使用localStorage状态管理
  const {
    pagination: storedPagination,
    filter: storedFilter,
    search: storedSearch,
    orderBy: storedOrderBy,
    orderColumn: storedOrderColumn,
    selectedRuleId: storedSelectedRuleId,
    setPagination: setStoredPagination,
    setFilter: setStoredFilter,
    setSearch: setStoredSearch,
    setSelectedRuleId: setStoredSelectedRuleId,
  } = useMediaDataStore();

  // 合并localStorage状态和本地状态
  const pagination = useMemo(
    () => ({
      pageSize: defaultPageSizeLS ?? defaultPageSize,
      pageIndex: storedPagination.pageIndex,
    }),
    [defaultPageSizeLS, defaultPageSize, storedPagination.pageIndex],
  );

  const filter = storedFilter;
  const search = storedSearch;
  const sortCondition: ISortCondition = useMemo(
    () => ({ orderBy: storedOrderBy as any, orderColumn: storedOrderColumn as any }),
    [storedOrderBy, storedOrderColumn],
  );
  const selectedRuleId = storedSelectedRuleId;

  // 更新分页状态
  const setPagination = useCallback(
    (updater: Updater<PaginationState>) => {
      const newPagination = typeof updater === 'function' ? updater(pagination) : updater;
      setStoredPagination(newPagination);
    },
    [pagination, setStoredPagination],
  );

  // 更新筛选条件
  const setFilter = useCallback(
    (newFilter: Partial<IListUgcDto['filter']>) => {
      setStoredFilter(newFilter);
      // 筛选时重置分页到第一页
      setStoredPagination({ pageIndex: 0 });
    },
    [setStoredFilter, setStoredPagination],
  );

  // 更新排序条件
  // const setSortCondition = useCallback(
  //   (newSortCondition: ISortCondition) => {
  //     setStoredOrder(newSortCondition.orderBy, newSortCondition.orderColumn);
  //   },
  //   [setStoredOrder],
  // );

  // 更新选中规则ID
  const setSelectedRuleId = useCallback(
    (ruleId?: string) => {
      setStoredSelectedRuleId(ruleId);
    },
    [setStoredSelectedRuleId],
  );

  // 搜索输入处理（防抖）
  const [searchInput, setSearchInput] = useState<string>(search); // 用户输入的即时值

  // 防抖：用户停止输入 500ms 后才触发搜索
  useDebounceEffect(
    () => {
      setStoredSearch(searchInput);
      // 搜索时重置分页到第一页
      setStoredPagination({ pageIndex: 0 });
    },
    [searchInput],
    { wait: 500 },
  );

  // 当store中的search变化时，同步到输入框
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Clear search when assetKey changes to prevent search state leaking between pages
  useEffect(() => {
    setStoredSearch('');
    setSearchInput('');
  }, [assetKey, setStoredSearch]);

  // 处理文件夹点击
  const handleFolderClick = (folderId: string, folderFilter: Partial<IListUgcDto['filter']>) => {
    // 设置左侧分组选中状态
    setSelectedRuleId(folderId);

    // 应用筛选条件
    setFilter(folderFilter);

    // 重置分页到第一页
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));

    // 切换到画廊视图
    setDisplayModeStorage((prev) => {
      const newStorage = {
        ...prev,
        [team.teamId]: {
          ...prev[team.teamId],
          [assetKey]: 'gallery',
        },
      };
      return newStorage;
    });
  };

  // fetch data
  const {
    data: rawData,
    isLoading,
    mutate,
  } = useUgcFetcher({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: search || undefined,
    filter,
    orderBy: sortCondition.orderBy,
    orderColumn: sortCondition.orderColumn,
  });

  // 获取所有数据用于文件夹视图
  // 注意：文件夹视图需要所有数据，不应受筛选条件影响，只保留搜索条件
  // 对于媒体文件，使用新的API接口直接获取分组数据
  const isMediaFile = assetKey === 'media-data' || assetType === 'media-file';
  const { data: folderViewData } = useUgcMediaDataForFolderView(isMediaFile ? search : undefined);
  
  const { data: allDataRaw } = useUgcFetcher({
    page: 1,
    limit: 100000, // 获取大量数据
    search: search || undefined,
    filter: {}, // 文件夹视图不使用筛选条件，以获取所有数据
    orderBy: sortCondition.orderBy,
    orderColumn: sortCondition.orderColumn,
  });

  const data = useMemo(() => {
    // For tools with category filter, use all data; otherwise use paginated data
    const sourceData = assetType === 'tools' && filter?.cate ? allDataRaw : rawData;

    let result =
      sourceData && _.isArray(sourceData.data)
        ? assetType === 'tools' && filter?.cate
          ? sourceData.data.filter((l) =>
              filter.cate
                ? (l as unknown as IAssetItem<IWorkflowTool>)?.categories?.includes(filter.cate as ToolCategory)
                : true,
            )
          : sourceData.data
        : [];

    // Apply pagination for filtered tools
    if (assetType === 'tools' && filter?.cate) {
      const startIndex = pagination.pageIndex * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      result = result.slice(startIndex, endIndex);
    }

    return result.map((it, i) => {
      const { description, displayName } = it as IAssetItem<E> & { displayName?: string };

      return {
        _key: `${i}_${it?.['id'] ?? ''}_${it?.['updatedTimestamp'] ?? ''}`,
        ...it,
        ...(description && { description: getI18nContent(description) }),
        ...(displayName && { displayName: getI18nContent(displayName) }),
      };
    });
  }, [rawData, allDataRaw, filter, assetType, pagination]);

  const pageData = useMemo(() => {
    // For tools with category filter, total should be the filtered count
    if (assetType === 'tools' && filter?.cate && allDataRaw) {
      const filteredCount = allDataRaw.data.filter((l) =>
        (l as unknown as IAssetItem<IWorkflowTool>)?.categories?.includes(filter.cate as ToolCategory),
      ).length;
      return {
        total: filteredCount,
        limit: pagination.pageSize,
        page: pagination.pageIndex + 1,
      };
    }

    return rawData
      ? _.pick(rawData, ['total', 'limit', 'page'])
      : {
          total: 0,
          limit: pagination.pageSize,
          page: 1,
        };
  }, [rawData, allDataRaw, assetType, filter, pagination]);

  const handlePreload = (pageIndex: number) =>
    preloadUgcFetcher?.({
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

  // oem config & url state 控制项
  const defaultUgcConfig = {
    subtitle: true,
    onItemClick: true,
  } as CustomizationUgc;

  const { data: oem } = useSystemConfig();
  const oemUgcConfig = get(oem, ['theme', 'ugc'], defaultUgcConfig);
  const [{ ugc: urlUgcConfig }] = useUrlState<{ ugc?: CustomizationUgc }>();

  // url > oem
  const ugcConfig: CustomizationUgc = useMemo(() => {
    return {
      ...oemUgcConfig,
      ...urlUgcConfig,
    };
  }, [oemUgcConfig, urlUgcConfig]);

  const paginationPosition = get(oem, ['theme', 'paginationPosition'], 'left');

  const onItemClick = ugcConfig.onItemClick ? onItemClickProp : undefined;
  const subtitle = ugcConfig.subtitle ? subtitleProp : undefined;
  const { data: assetFilterRules } = useAssetFilterRuleList(assetType as any, isMarket);
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
          toolsData:
            assetType === 'tools' ? ((allDataRaw?.data ?? []) as unknown as IAssetItem<ICommonTool>[]) : undefined,
          selectedRuleId,
          onSelectedRuleIdChange: setSelectedRuleId,
        }}
      />
      <div className="relative w-full flex-1 overflow-x-clip">
        <UgcViewHeader
          assetKey={assetKey}
          assetType={assetType}
          isMarket={isMarket}
          subtitle={subtitle}
          search={searchInput}
          onSearchChange={setSearchInput}
          showSearch={showSearch}
          filterButtonProps={{
            filter,
            onChange: setFilter,
          }}
        />
        <div className="relative size-full overflow-hidden">
          <AnimatePresence>
            {(isLoading || isNull(displayMode)) && <VinesFullLoading motionKey={`vines-assets-${assetKey}-loading`} />}
          </AnimatePresence>
          <div className="flex size-full flex-col">
            <div
              className="relative w-full overflow-y-auto p-global pt-global-1/2"
              style={{ height: showPagination ? 'calc(100% - 4.9rem)' : 'calc(100% - 1.7rem)' }}
            >
              {displayMode === 'folder' ? (
                <UgcViewFolderView
                  allData={allDataRaw?.data || []}
                  filter={filter}
                  assetFilterRules={assetFilterRules || []}
                  onFolderClick={handleFolderClick}
                  folderViewData={isMediaFile ? folderViewData : undefined}
                />
              ) : rows.length === 0 ? (
                !isLoading && (
                  <motion.div
                    className="vines-center size-full h-[calc(100vh-12rem)] flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.3 } }}
                  >
                    {/* <CircleSlash size={64} />
                    <div className="mt-4 flex flex-col text-center">
                      <h2 className="font-bold">{t('common.load.empty')}</h2>
                    </div> */}
                    <Empty size={64} customIconSize={128} />
                  </motion.div>
                )
              ) : (
                <>
                  {displayMode === 'card' && (
                    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {rows.map((row, index) => {
                        // 如果提供了自定义卡片渲染函数，使用它
                        if (renderOptions.customCard) {
                          return (
                            <div
                              key={
                                row.original?.['_key'] ??
                                (row.original?.['id'] ?? '') + (row.original['updatedTimestamp'] ?? '')
                              }
                              className="h-fit"
                            >
                              {renderOptions.customCard(row.original)}
                            </div>
                          );
                        }

                        // 否则使用默认的UgcViewCard
                        return (
                          <UgcViewCard
                            row={row}
                            key={
                              row.original?.['_key'] ??
                              (row.original?.['id'] ?? '') + (row.original['updatedTimestamp'] ?? '')
                            }
                            index={index}
                            columns={columns}
                            renderOptions={renderOptions}
                            operateArea={operateArea}
                            onItemClick={onItemClick}
                            ugcOptions={ugcConfig}
                          />
                        );
                      })}
                    </div>
                  )}
                  {displayMode === 'table' && (
                    <RemoteDataTable
                      columns={
                        columns.map((col) => {
                          if (col.id === 'title' && !ugcConfig.onItemClick) {
                            return {
                              ...col,
                              cell: DefaultTitleCell,
                            };
                          }
                          return col;
                        }) as any
                      }
                      data={data}
                      onPaginationChange={table.setPagination}
                      rowCount={table.getRowCount()}
                      state={table.getState()}
                      showPagination={false}
                    />
                  )}
                  {displayMode === 'gallery' && (
                    <div className="flex flex-wrap gap-global">
                      {rows.map((row, index) => (
                        <UgcViewGalleryItem
                          row={row}
                          columns={columns}
                          key={row.original['id'] + (row.original['updatedTimestamp'] ?? '')}
                          index={index}
                          renderOptions={renderOptions}
                          operateArea={operateArea}
                          onItemClick={onItemClick}
                          ugcOptions={ugcConfig}
                          assetType={assetType}
                          assetKey={assetKey}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            {showPagination && displayMode !== 'folder' && (
              <TablePagination
                className={cn('py-0', paginationPosition === 'right' ? 'justify-end gap-global' : '')}
                pagination={table.getState().pagination}
                onPaginationChange={table.setPagination}
                rowCount={table.getRowCount()}
                preloadHover={handlePreload}
                isLoadAll={isLoadAll}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
