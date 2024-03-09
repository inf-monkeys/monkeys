import useSWR from 'swr';

import { vinesFetcher } from '@/apis/fetcher.ts';
import { VinesToolDef } from '@/package/vines-flow/core/tools/typings.ts';

export const useToolLists = (apikey?: string) =>
  useSWR<VinesToolDef[] | undefined>('/api/blocks', vinesFetcher({ apikey }), {
    refreshInterval: 600000,
    revalidateOnFocus: false,
  });
