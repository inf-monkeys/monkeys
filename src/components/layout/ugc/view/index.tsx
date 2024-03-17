import React from 'react';

import { useElementSize } from '@mantine/hooks';

import { IPaginationListData } from '@/apis/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { UgcViewCard } from '@/components/layout/ugc/view/card';
import { UgcViewHeader } from '@/components/layout/ugc/view/header.tsx';

interface IUgcViewProps<E extends object> {
  // fetchFunction: IListUgcItemsFnType<E>;
  data: IPaginationListData<IAssetItem<E>>;
}

export const UgcView = <E extends object>({
  // fetchFunction,
  data,
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

  return (
    <div ref={ref} className="relative w-full flex-1 overflow-x-clip">
      <UgcViewHeader />
      <div className="relative h-[calc(100%-3.2rem)] w-full overflow-hidden rounded-r-lg p-4">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {data.data.map((item, index) => (
            <UgcViewCard data={item} key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};
