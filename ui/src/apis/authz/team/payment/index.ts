import useSWR from 'swr';

import { IOrder, IOrderTag, ITeamBalance } from '@/apis/authz/team/payment/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';

export const useTeamBalance = () =>
  useSWR<ITeamBalance | undefined>('/api/payment/balances', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamOrderList = (types: IOrderTag[], page = 1, limit = 24) =>
  useSWR<IPaginationListData<IOrder> | undefined>(
    `/api/payment/orders?page=${page}&limit=${limit}&types=${types.join(',')}`,
    vinesFetcher({ wrapper: paginationWrapper }),
  );
