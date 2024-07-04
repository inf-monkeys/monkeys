import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

import { IOrder, IOrderType, IRechargeOrder, ITeamBalance } from '@/apis/authz/team/payment/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';
import { IPaginationListData } from '@/apis/typings.ts';
import { paginationWrapper } from '@/apis/wrapper.ts';

export const useTeamBalance = () =>
  useSWR<ITeamBalance | undefined>('/api/payment/balances', vinesFetcher(), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });

export const useTeamOrderList = (types: IOrderType[], page = 1, limit = 24) =>
  useSWR<IPaginationListData<IOrder> | undefined>(
    `/api/payment/orders?page=${page}&limit=${limit}&types=${types.join(',')}`,
    vinesFetcher({ wrapper: paginationWrapper }),
  );

export const usePaymentOrder = (orderId: string) =>
  useSWR<IRechargeOrder | undefined>(orderId ? `/api/payment/orders/${orderId}` : null, vinesFetcher(), {
    refreshInterval: 500,
  });

export const usePaymentOrderClose = (orderId: string) =>
  useSWRMutation(orderId ? `/api/payment/orders/${orderId}` : null, vinesFetcher({ method: 'DELETE' }));

export const usePaymentOrderCreate = () =>
  useSWRMutation<IRechargeOrder | undefined, unknown, string, { amount: number }>(
    '/api/payment/orders',
    vinesFetcher({ method: 'POST' }),
  );
