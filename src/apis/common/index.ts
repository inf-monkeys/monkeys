import useSWRImmutable from 'swr/immutable';

import { IOemConfig } from '@/apis/common/typings.ts';
import { useGetFetcher } from '@/apis/fetcher.ts';

export const useOemConfig = () => useSWRImmutable<IOemConfig>('/api/configs', useGetFetcher);
