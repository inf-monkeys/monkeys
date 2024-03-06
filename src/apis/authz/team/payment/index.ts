import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';

import { IOrderTag, ITeamBalance } from '@/apis/authz/team/payment/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useTeamBalance = () =>
  useSWR<ITeamBalance>('/api/payment/balances', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamOrderList = (types: IOrderTag[], limit = 24) => {
  const getKey = (page, previousPageData) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/api/payment/orders?page=${page}&limit=${limit}&types=${types.join(',')}`;
  };
  return useSWRInfinite(getKey, vinesFetcher({ pagination: true }));
};
