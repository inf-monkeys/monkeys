import React from 'react';

import { Middleware, SWRHook } from 'swr';

import { debounce } from 'lodash';
import { ExternalToast, toast } from 'sonner';

import { CommonFetcherResponse } from '@/apis/fetcher.ts';

const noticedMap = new Map<string, number>();

const debounceToast = debounce(
  (
    id: string,
    type: 'success' | 'info' | 'warning' | 'error' | 'message' | 'loading',
    ...args: [string | React.ReactNode, ExternalToast?]
  ) => {
    if (noticedMap.has(id)) return;
    toast[type](...args);
    noticedMap.set(id, 1);
  },
  200,
);

export const swrMiddleware: Middleware = (useSWRNext: SWRHook) => (key, fetcher, config) => {
  const swr = useSWRNext(key, fetcher, config);

  if (!swr?.data) return swr;

  const { r: swrResult, _: fetchId } = swr?.data as unknown as { r: CommonFetcherResponse<unknown>; _: string };
  const code = swrResult?.code;
  const data = swrResult?.data || void 0;

  if (code) {
    if (code !== 200) {
      const errorMessage = swrResult?.message || null;
      if (code === 403) {
        if (errorMessage) {
          debounceToast(fetchId, 'warning', errorMessage);
          return Object.assign({}, swr, { data: null, error: new Error(errorMessage) });
        }
        debounceToast(fetchId, 'warning', '请先登录');
        return Object.assign({}, swr, { data: null, error: new Error('需要登录') });
      } else {
        debounceToast(fetchId, 'warning', errorMessage || '网络错误');
        return Object.assign({}, swr, { data: null, error: new Error(errorMessage || '网络错误') });
      }
    }
  }

  return Object.assign({}, swr, { data });
};
