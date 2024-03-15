import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { IVectorFrontEnd } from '@/apis/vector/typings.ts';

export const useVectorCollections = () =>
  useSWR<IVectorFrontEnd[] | undefined>('/api/vector/collections', vinesFetcher());
