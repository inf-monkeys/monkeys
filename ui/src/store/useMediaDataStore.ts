import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { IListUgcDto } from '@/apis/ugc/typings';

interface IMediaDataState {
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  filter: Partial<IListUgcDto['filter']>;
  search: string;
  orderBy: string;
  orderColumn: string;
  selectedRuleId?: string;
}

interface IMediaDataActions {
  setPagination: (pagination: Partial<IMediaDataState['pagination']>) => void;
  setFilter: (filter: Partial<IListUgcDto['filter']>) => void;
  setSearch: (search: string) => void;
  setOrder: (orderBy: string, orderColumn: string) => void;
  setSelectedRuleId: (ruleId?: string) => void;
  reset: () => void;
}

const initialState: IMediaDataState = {
  pagination: {
    pageIndex: 0,
    pageSize: 24,
  },
  filter: {},
  search: '',
  orderBy: 'desc',
  orderColumn: 'createdTimestamp',
  selectedRuleId: undefined,
};

export const useMediaDataStore = create<IMediaDataState & IMediaDataActions>()(
  persist(
    (set, _get) => ({
      ...initialState,

      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      setFilter: (filter) => set({ filter }),

      setSearch: (search) => set({ search }),

      setOrder: (orderBy, orderColumn) => set({ orderBy, orderColumn }),

      setSelectedRuleId: (selectedRuleId) => set({ selectedRuleId }),

      reset: () => set(initialState),
    }),
    {
      name: 'vines-ui-media-data-state',
      // 只持久化状态，不持久化actions
      partialize: (state) => ({
        pagination: state.pagination,
        filter: state.filter,
        search: state.search,
        orderBy: state.orderBy,
        orderColumn: state.orderColumn,
        selectedRuleId: state.selectedRuleId,
      }),
    },
  ),
);

// 导出hooks
export const useMediaDataPagination = () => useMediaDataStore((state) => state.pagination);
export const useMediaDataFilter = () => useMediaDataStore((state) => state.filter);
export const useMediaDataSearch = () => useMediaDataStore((state) => state.search);
export const useMediaDataOrder = () =>
  useMediaDataStore((state) => ({
    orderBy: state.orderBy,
    orderColumn: state.orderColumn,
  }));
export const useMediaDataSelectedRuleId = () => useMediaDataStore((state) => state.selectedRuleId);

export const useSetMediaDataPagination = () => useMediaDataStore((state) => state.setPagination);
export const useSetMediaDataFilter = () => useMediaDataStore((state) => state.setFilter);
export const useSetMediaDataSearch = () => useMediaDataStore((state) => state.setSearch);
export const useSetMediaDataOrder = () => useMediaDataStore((state) => state.setOrder);
export const useSetMediaDataSelectedRuleId = () => useMediaDataStore((state) => state.setSelectedRuleId);
export const useResetMediaData = () => useMediaDataStore((state) => state.reset);
