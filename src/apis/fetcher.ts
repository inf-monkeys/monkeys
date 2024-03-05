import stringify from 'fast-json-stable-stringify';
import { toast } from 'sonner';

import { IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';

import 'unfetch/polyfill';

// region SWR Fetcher

interface IFetcherOptions<U = unknown> extends IVinesHeaderOptions {
  method?: 'GET' | 'POST';
  auth?: boolean;
  simple?: boolean;
  wrapper?: (data: U) => any;
}

export const vinesFetcher = <U, T = {}>({
  method = 'GET',
  auth = true,
  simple = false,
  apiKey,
  wrapper = (data: U) => data,
}: IFetcherOptions<U> = {}) => {
  return async (url: string, params?: T): Promise<U> => {
    const headers = {
      'Content-Type': 'application/json;charset=utf-8',
      ...(auth && vinesHeader({ apiKey, useToast: simple })),
    };

    const body = params ? stringify(simple ? params : params['arg']) : undefined;

    return await fetch(url, {
      method,
      headers,
      body,
    }).then(async (r) => {
      const raw = await r.json();

      const code = raw?.code || raw?.status;
      const data = raw?.data || void 0;

      if (code && code !== 200) {
        const errorMessage = raw?.message || null;

        if (simple) {
          toast.warning(errorMessage ? errorMessage : code === 403 ? '需要登录' : '网络错误');
          return null;
        } else {
          throw new Error(errorMessage || '网络错误');
        }
      }

      return wrapper(data);
    });
  };
};
