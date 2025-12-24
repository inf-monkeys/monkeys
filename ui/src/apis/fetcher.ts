import _, { isArray } from 'lodash';
import { toast } from 'sonner';

import { IOriginData } from '@/apis/typings.ts';
import { getVinesToken, IVinesHeaderOptions, vinesHeader } from '@/apis/utils.ts';
import i18n from '@/i18n.ts';
import VinesEvent from '@/utils/events.ts';
import { stringify } from '@/utils/fast-stable-stringify.ts';
import { transformOssUrlsInObject } from '@/utils/oss-presign';

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

      let raw: IOriginData<U>;
      try {
        raw = (await r.json()) as IOriginData<U>;
      } catch (e) {
        // 后端返回的不是 JSON（例如 HTML 错误页），降级使用 HTTP 状态码
        const status = r.status || 0;

        if (status === 403) {
          const isTeamInitStatus =
            typeof url === 'string' && /\/api\/teams\/[^/]+\/init-status$/.test(url);
          const isUserProfile = url === '/api/users/profile';
          const isTeamsRoot =
            typeof url === 'string' && /^\/api\/teams($|\?)/.test(url);

          // 这些接口的 403 视为普通权限不足，不触发登录过期提示
          if (isTeamInitStatus || isUserProfile || isTeamsRoot) {
            if (simple) {
              return void 0 as U;
            } else {
              throw new Error('Forbidden');
            }
          }

          // 其他 403（非 JSON 响应），统一视为普通权限错误
          if (simple) {
            return void 0 as U;
          }
          throw new Error('Forbidden');
        }

        if (status === 404) {
          throw new Error('404 NOT FOUND');
        }

        if (simple) {
          return void 0 as U;
        }
        throw new Error('Network Error');
      }

      const code = raw?.code || raw?.status;
      const data = raw?.data || void 0;

      if (code && code !== 200) {
        if (code === 404) {
          throw new Error('404 NOT FOUND');
        }

        const errorMessage = raw?.message || null;

        if (code === 403) {
          const isTeamInitStatus =
            typeof url === 'string' && /\/api\/teams\/[^/]+\/init-status$/.test(url);
          const isUserProfile = url === '/api/users/profile';
          const isTeamsRoot =
            typeof url === 'string' && /^\/api\/teams($|\?)/.test(url);

          // 对团队初始化状态、用户资料和团队列表接口的 403 不弹「建议重新登录」提示，直接静默处理 / 抛出普通错误
          if (isTeamInitStatus || isUserProfile || isTeamsRoot) {
            if (simple) {
              return void 0;
            } else {
              throw new Error(errorMessage || 'Forbidden');
            }
          }

          // 只有当后端明确返回“请先登录”时，才触发登录过期逻辑
          const isLoginRequired = errorMessage === '请先登录';
          if (!isLoginRequired) {
            if (simple) {
              return void 0;
            } else {
              throw new Error(errorMessage || 'Forbidden');
            }
          }

          const routeType = window['vinesRoute']?.[0];
          const isInviteRoute = routeType === 'invite';
          
          clearTimeout(window['vinesRoute403_TIMEOUT']);
          window['vinesRoute403_TIMEOUT'] = window.setTimeout(() => {
            window['vinesRoute403_COUNT'] = 0;
            window['vinesRoute403_TOAST_ID'] = void 0;
          }, 3000);
          
          // 邀请页面不显示登录过期提示，直接抛出错误让页面处理
          if (!isInviteRoute && window['sideBarMode'] != 'mini' && window['hideAuthToast'] !== true) {
            if (window['vinesRoute403_COUNT']) {
              window['vinesRoute403_COUNT']++;
              const toastData = {
                action: {
                  label: t('auth.re-login'),
                  onClick: () => {
                    localStorage.removeItem('vines-token');
                    localStorage.removeItem('vines-team-id');
                    window['vinesTeamId'] = void 0;
                    VinesEvent.emit('vines-nav', '/login', void 0, void 0, false);
                  },
                },
              };

              if (window['vinesRoute403_TOAST_ID']) {
                toast(t('auth.login-required', { count: window['vinesRoute403_COUNT'] }), {
                  ...toastData,
                  id: window['vinesRoute403_TOAST_ID'],
                });
              } else {
                window['vinesRoute403_TOAST_ID'] = toast(t('auth.api-403'), toastData);
              }
            } else {
              window['vinesRoute403_COUNT'] = 1;
              toast.warning(t('auth.login-expired'));
            }
          }
          if (window['sideBarMode'] == 'mini') {
            window.location.reload();
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

      const result = wrapper(data, raw);
      const requestUrl = customRequest?.url || url;
      return await transformOssUrlsInObject(result, typeof requestUrl === 'string' ? requestUrl : '');
    });
  };
};
