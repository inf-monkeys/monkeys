import { Middleware, SWRHook } from 'swr';

import { toast } from 'sonner';

import { CommonFetcherResponse } from '@/apis/fetcher.ts';

export const swrMiddleware: Middleware = (useSWRNext: SWRHook) => (key, fetcher, config) => {
  const swr = useSWRNext(key, fetcher, config);

  const swrResult = swr.data as CommonFetcherResponse<unknown>;
  const code = swrResult?.code;
  const data = swrResult?.data || void 0;
  if (code) {
    if (code !== 200) {
      if (code === 403) {
        toast.warning('请先登录');
        return Object.assign({}, swr, { data: null, error: new Error('需要登录') });
      } else {
        const errorMessage = swrResult?.message || '网络错误';
        toast.warning(errorMessage);
        return Object.assign({}, swr, { data: null, error: new Error(errorMessage) });
      }
    }
  }

  return Object.assign({}, swr, { data });
};
