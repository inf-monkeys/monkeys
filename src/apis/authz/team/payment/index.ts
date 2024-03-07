import useSWR from 'swr';

import { pick } from 'lodash';

import { IOrder, IOrderTag, ITeamBalance } from '@/apis/authz/team/payment/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useTeamBalance = () =>
  useSWR<ITeamBalance | undefined>('/api/payment/balances', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamOrderList = (types: IOrderTag[], page = 1, limit = 24) => {
  // 预加载
  useSWR<IOrder | undefined>(
    `/api/payment/orders?page=${page + 1}&limit=${limit}&types=${types.join(',')}`,
    vinesFetcher({ wrapper: (_, data) => pick(data, ['data', 'page', 'limit', 'total']) as unknown as IOrder }),
  );

  return useSWR<IOrder | undefined>(
    `/api/payment/orders?page=${page}&limit=${limit}&types=${types.join(',')}`,
    vinesFetcher({ wrapper: (_, data) => pick(data, ['data', 'page', 'limit', 'total']) as unknown as IOrder }),
  );
};
