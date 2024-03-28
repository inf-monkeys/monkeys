import React, { useMemo, useState } from 'react';

import { useElementSize } from '@mantine/hooks';
import {
  ColumnDef,
  functionalUpdate,
  getCoreRowModel,
  PaginationState,
  Updater,
  useReactTable,
} from '@tanstack/react-table';
import { AnimatePresence } from 'framer-motion';
import _, { isNull } from 'lodash';
import { MoreHorizontal } from 'lucide-react';

import { IAssetItem, IListUgcItemsFnType, IPreloadUgcItemsFnType } from '@/apis/ugc/typings.ts';
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
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { RemoteDataTable } from '@/components/ui/data-table/remote.tsx';
import { Loading } from '@/components/ui/loading';
import { TablePagination } from '@/components/ui/pagination/table-pagination.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { useLocalStorage } from '@/utils';

interface IUgcViewProps<E extends object> {
  assetKey: string;
  useUgcFetcher: IListUgcItemsFnType<E>;
  preloadUgcFetcher: IPreloadUgcItemsFnType<E>;
  // data: IPaginationListData<IAssetItem<E>>;
  columns: ColumnDef<IAssetItem<E>>[];
  renderOptions: IUgcRenderOptions<IAssetItem<E>>;
  operateArea?: IOperateAreaProps<E>;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  subtitle?: React.ReactNode;
  defaultPageSize?: number;
}

export const UgcView = <E extends object>({
  assetKey,
  useUgcFetcher,
  preloadUgcFetcher,
  // data,
  columns,
  renderOptions,
  operateArea,
  onItemClick,
  subtitle,
  defaultPageSize = 24,
}: IUgcViewProps<E>): React.ReactNode => {
  const { ref } = useElementSize();

  // const { formatTimeDiffPrevious } = useTimeDiff();
  // const [dto, setDto] = useState<IListUgcDto>({ page: 1, limit: defaultLimit, filter: {} });
  // const dtoRef = useRef<IListUgcDto>({ page: 1, limit: defaultLimit, filter: {} });
  // const [list, setList] = useState<IAssetItem<E>[]>([]);
  // const listRef = useRef<IAssetItem<E>[]>([]);
  // const [total, setTotal] = useState(0);
  // const totalRef = useRef(0);
  // const [loading, toggleLoading] = useState(false);
  // const loadingRef = useRef(false);
  // const [activeItem, setActiveItem] = useState<{ item: IAssetItem<E>; itemKey?: string } | null>(null);
  // const [search, setSearch] = useState('');
  // const [searchMode, toggleSearchMode] = useState(false);
  // const [tags, setTags] = useState<string[]>([]);
  // const [filterRules, setFilterRules] = useState<IUgcFilterRules[]>([]);
  // const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  // const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  // const [mode, setMode] = useState<IDisplayMode>(null);
  // const [dividePageMethod, setDividePageMethod] = useState<ISortCondition['dividePage'] | null>(null);
  // const containerRef = useRef<HTMLDivElement>(null);
  // const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // const listContainerRef = useRef<HTMLDivElement>();
  // const [sidebarVisible, toggleSidebarVisible] = useState(true);
  // const [publicCategories, setPublicCategories] = useState<IAssetPublicCategory[]>([]);
  // const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  // const [currentAsset, setCurrentAsset] = useState<IAssetItem<E> | null>(null);
  // const [expandBlockCategory, setExpandBlockCategory] = useState<'simple' | 'extra' | null>('simple');

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

  useMemo(() => {
    defaultPageSizeLS &&
      setPagination((prev) => {
        return {
          ...prev,
          pageSize: defaultPageSizeLS,
        };
      });
  }, [defaultPageSizeLS]);

  const {
    data: rawData,
    isLoading,
    mutate,
  } = useUgcFetcher({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    filter: {},
    orderBy: sortCondition.orderBy,
    orderColumn: sortCondition.orderColumn,
  });

  const data = useMemo(() => (rawData && _.isArray(rawData.data) ? rawData.data : []), [rawData]);
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

  // 添加操作列
  if (operateArea && !columns.find((c) => c.id === 'operate')) {
    columns.push({
      id: 'operate',
      size: 24,
      header: '操作',
      cell: ({ row }) => operateArea(row.original, <Button icon={<MoreHorizontal />} size="small" />, '操作'),
    });
  }

  // 使用 tanstack table 管理状态
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
      // sorting,
    },
    manualPagination: true,
    rowCount: pageData.total,
    onPaginationChange,
    // manualSorting: true,
  });

  return (
    <div ref={ref} className="relative w-full flex-1 overflow-x-clip">
      <UgcViewHeader assetKey={assetKey} subtitle={subtitle} mutate={mutate} />
      <SmoothTransition className="relative overflow-clip">
        <AnimatePresence>
          {isLoading || (isNull(displayMode) && <Loading motionKey="vines-assets-loading" />)}
        </AnimatePresence>
        <div className="flex flex-col">
          <ScrollArea className="relative h-[calc(100vh-10.5rem)] w-full rounded-r-lg px-4 py-2">
            {displayMode === 'card' && (
              <div className="grid w-full grid-cols-1 gap-6 overflow-y-auto lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {table.getRowModel().rows.map((row, index) => (
                  <UgcViewCard
                    row={row}
                    key={index}
                    index={index}
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
                {table.getRowModel().rows.map((row, index) => (
                  <UgcViewGalleryItem
                    row={row}
                    key={index}
                    index={index}
                    renderOptions={renderOptions}
                    operateArea={operateArea}
                    onItemClick={onItemClick}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
          <TablePagination
            className="py-0"
            pagination={table.getState().pagination}
            onPaginationChange={table.setPagination}
            rowCount={table.getRowCount()}
            preloadHover={handlePreload}
          />
        </div>
      </SmoothTransition>
    </div>
  );
};
