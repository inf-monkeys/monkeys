import useSWRImmutable from 'swr/immutable';

import { IOemConfig } from '@/apis/common/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useOemConfig = () =>
  useSWRImmutable<IOemConfig, unknown, string>('/api/configs', vinesFetcher({ simple: true, auth: false }));
