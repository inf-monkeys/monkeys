import useSWRImmutable from 'swr/immutable';

import { ISystemConfig } from '@/apis/common/typings.ts';
import { vinesFetcher } from '@/apis/fetcher.ts';

export const useSystemConfig = () =>
  useSWRImmutable<ISystemConfig | undefined, unknown, string>(
    '/api/configs',
    vinesFetcher({ simple: true, auth: false }),
  );
