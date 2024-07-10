import _, { isArray } from 'lodash';
import { toast } from 'sonner';

import { IOriginData } from '@/apis/typings.ts';
import { getVinesToken, IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';
import i18n from '@/i18n.ts';
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
  responseResolver?: (response: Response) => U | Promise<U>;
}

const t = i18n.t;
const UN_AUTH_SKIP_URLS = ['/api/teams', '/api/users/profile'];

export const vinesFetcher = <U, T = {}, P extends boolean = false>({
  method = 'GET',
  auth = true,
  simple = false,
  apikey,
  wrapper = (data) => data,
  fetchOptions,
  responseResolver,
}: IFetcherOptions<U, P> = {}) => {
  return async (rawUrl: string | [url: string, params?: T], rawParams?: T) => {
    const headers = {
      'Content-Type': 'application/json;charset=utf-8',
      ...(auth && vinesHeader({ apikey, useToast: simple })),
      ...(fetchOptions && fetchOptions.headers),
    } as HeadersInit;

    const isArrayRawUrl = isArray(rawUrl);
    const url = isArrayRawUrl ? rawUrl[0] : rawUrl;
    const params = isArrayRawUrl ? rawUrl[1] : rawParams;

    if (!getVinesToken()) {
      if (window['vinesRoute']?.[0] === 'workspace' && UN_AUTH_SKIP_URLS.includes(url)) {
        throw new Error('');
      }
    }

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
        if (code === 404) {
          throw new Error('404 NOT FOUND');
        }

        const errorMessage = raw?.message || null;
        toast.warning(
          errorMessage
            ? t([`common.toast.${errorMessage}`, errorMessage])
            : code === 403
              ? '请先登录'
              : 'Network Error',
        );

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
