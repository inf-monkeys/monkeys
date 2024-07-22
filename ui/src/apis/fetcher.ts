import _, { isArray } from 'lodash';
import { toast } from 'sonner';

import { IOriginData } from '@/apis/typings.ts';
import { getVinesToken, IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';
import i18n from '@/i18n.ts';
import VinesEvent from '@/utils/events.ts';
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
  requestResolver?: ({ rawUrl, params }: { rawUrl: string; params?: Record<string, any> }) => {
    url: string;
    body?: string;
  };
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
  requestResolver,
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

    const customRequest = requestResolver?.({ rawUrl: url, params: simple ? params : params?.['arg'] });

    const body = customRequest ? customRequest.body : params ? stringify(simple ? params : params['arg']) : undefined;

    return await fetch(customRequest?.url || url, {
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

        if (code === 403) {
          if (window['vinesRoute403_COUNT']) {
            window['vinesRoute403_COUNT']++;
            if (window['vinesRoute403_TOAST_ID']) {
              toast(window['vinesRoute403_COUNT'], { id: window['vinesRoute403_TOAST_ID'] });
            } else {
              window['vinesRoute403_TOAST_ID'] = toast(t('auth.api-invalid'), {
                action: {
                  label: t('auth.re-login'),
                  onClick: () => {
                    localStorage.removeItem('vines-token');
                    localStorage.removeItem('vines-team-id');
                    VinesEvent.emit('vines-nav', '/login');
                  },
                },
              });
            }
          } else {
            window['vinesRoute403_COUNT'] = 1;
            toast.warning(t('auth.login-expired'));
          }
          throw new Error('Login Required');
        } else {
          toast.warning(errorMessage ? t([`common.toast.${errorMessage}`, errorMessage]) : 'Network Error');
        }

        if (simple) {
          return void 0;
        } else {
          throw new Error(errorMessage || 'Network Error');
        }
      }

      return wrapper(data, raw);
    });
  };
};
