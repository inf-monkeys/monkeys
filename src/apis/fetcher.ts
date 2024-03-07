import stringify from 'fast-json-stable-stringify';
import _ from 'lodash';
import { toast } from 'sonner';

import { IPaginationListData } from '@/apis/typings.ts';
import { IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';

import 'unfetch/polyfill';

// region SWR Fetcher

type VinesResult<P extends boolean, U> = P extends true ? IPaginationListData<U> : U;

interface IFetcherOptions<U = unknown, P extends boolean = false> extends IVinesHeaderOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth?: boolean;
  simple?: boolean;
  pagination?: P;
  wrapper?: (data: U) => VinesResult<P, U>; // 修复此处
  fetchOptions?: RequestInit;
  responseResolver?: (response: Response) => U;
}

export const vinesFetcher = <U, T = {}, P extends boolean = false>({
  method = 'GET',
  auth = true,
  simple = false,
  apikey,
  wrapper = (data: U) => data as VinesResult<P, U>,
  fetchOptions,
  responseResolver,
  pagination,
}: IFetcherOptions<U, P> = {}) => {
  return async (url: string, params?: T) => {
    const headers = {
      'Content-Type': 'application/json;charset=utf-8',
      ...(auth && vinesHeader({ apikey, useToast: simple })),
      ...(fetchOptions && fetchOptions.headers),
    };

    const body = params ? stringify(simple ? params : params['arg']) : undefined;

    return await fetch(url, {
      method,
      headers,
      body,
      ...(fetchOptions && _.omit(fetchOptions, 'headers')),
    }).then(async (r) => {
      if (responseResolver) {
        return responseResolver(r) as U;
      }

      const raw = await r.json();

      const code = raw?.code || raw?.status;
      const data = raw?.data || void 0;

      if (code && code !== 200) {
        const errorMessage = raw?.message || null;

        if (simple) {
          toast.warning(errorMessage ? errorMessage : code === 403 ? '需要登录' : '网络错误');
          return void 0;
        } else {
          throw new Error(errorMessage || '网络错误');
        }
      }

      if (pagination) {
        return wrapper(_.pick(raw, ['data', 'page', 'limit', 'total']) as U);
      } else {
        return wrapper(data);
      }
    });
  };
};
