import stringify from 'fast-json-stable-stringify';
import _ from 'lodash';
import { toast } from 'sonner';

import { IPaginationListData } from '@/apis/typings.ts';
import { IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';

import 'unfetch/polyfill';

// region SWR Fetcher
interface IFetcherOptions<U = unknown> extends IVinesHeaderOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth?: boolean;
  simple?: boolean;
  wrapper?: (data: U) => any;
  fetchOptions?: RequestInit;
  responseResolver?: (response: Response) => any;
  pagination?: boolean;
}

export const vinesFetcher = <U, T = {}>({
  method = 'GET',
  auth = true,
  simple = false,
  apiKey,
  wrapper = (data: U) => data,
  fetchOptions,
  responseResolver,
  pagination = false,
}: IFetcherOptions<U> = {}) => {
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
    }).then(async (r) =>
      responseResolver
        ? responseResolver(r)
        : (async () => {
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

            return wrapper(
              pagination ? (_.pick(raw, ['data', 'page', 'limit', 'total']) as IPaginationListData<U>) : data,
            );
          })(),
    );
  };
};
