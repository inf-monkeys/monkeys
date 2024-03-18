import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { IUgcRenderOptions } from '@/components/layout/ugc/typings.ts';
import { UgcViewCard } from '@/components/layout/ugc/view/card';
import { UgcViewHeader } from '@/components/layout/ugc/view/header.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';

interface IUgcViewProps<E extends object> {
  assetKey: string;
  // fetchFunction: IListUgcItemsFnType<E>;
  data: IPaginationListData<IAssetItem<E>>;
  columns: ColumnDef<IAssetItem<E>>[];
  renderOptions: IUgcRenderOptions<E>;
  operateArea?: (item: IAssetItem<E>) => React.ReactNode;
  onItemClick?: (item: IAssetItem<E>, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  subtitle?: React.ReactNode;
}

export const UgcView = <E extends object>({
  assetKey,
  // fetchFunction,
  data,
  columns,
  renderOptions,
  operateArea,
  onItemClick,
  subtitle,
}: IUgcViewProps<E>): React.ReactNode => {
  // FIXME: temp const
  const defaultLimit = 3;

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

  // 使用 tanstack table 管理状态
  const table = useReactTable({ data: data.data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div ref={ref} className="relative w-full flex-1 overflow-x-clip">
      <UgcViewHeader assetKey={assetKey} subtitle={subtitle} />
      <ScrollArea className="relative h-[calc(100vh-9rem)] w-full rounded-r-lg px-4 py-2">
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
      </ScrollArea>
    </div>
  );
};
