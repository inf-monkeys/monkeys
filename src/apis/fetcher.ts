import _ from 'lodash';
import { toast } from 'sonner';

import { IOriginData } from '@/apis/typings.ts';
import { IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';

import 'unfetch/polyfill';

// region SWR Fetcher

interface IFetcherOptions<U = unknown, P extends boolean = false> extends IVinesHeaderOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  auth?: boolean;
  simple?: boolean;
  pagination?: P;
  wrapper?: (data: U | undefined, originData: IOriginData<U>) => U | undefined;
  fetchOptions?: RequestInit;
  responseResolver?: (response: Response) => U;
}

export const vinesFetcher = <U, T = {}, P extends boolean = false>({
  method = 'GET',
  auth = true,
  simple = false,
  apikey,
  wrapper = (data) => data,
  fetchOptions,
  responseResolver,
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

      const raw = (await r.json()) as IOriginData<U>;

      const code = raw?.code || raw?.status;
      const data = raw?.data || void 0;

      if (code && code !== 200) {
        const errorMessage = raw?.message || null;
        toast.warning(errorMessage ? errorMessage : code === 403 ? '请先登录' : '网络错误');

        if (code === 403) {
          throw new Error('请先登录');
        }

        if (simple) {
          return void 0;
        } else {
          throw new Error(errorMessage || '网络错误');
        }
      }

      return wrapper(data, raw);
    });
  };
};
