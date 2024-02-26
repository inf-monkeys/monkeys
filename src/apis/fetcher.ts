import stringify from 'fast-json-stable-stringify';
import { nanoid } from 'nanoid';

import { readLocalStorageValue } from '@/utils';

import 'unfetch/polyfill';

export interface CommonFetcherResponse<T> {
  code: number;
  message: string;
  data: T;
}

// TIPS: 每个接口的返回值都必须被包装一层，以便于在请求时区分不同的请求
const wrapper = <T>(data: T) => ({ r: data, _: nanoid(10) }) as T;

export const useGetFetcher = (url: string) => fetch(url).then(async (r) => wrapper(await r.json()));

export const usePostFetcher = async <T, U>(url: string, { arg }: { arg: U }) => {
  return (await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: stringify(arg),
  }).then(async (r) => wrapper<T>(await r.json()))) as T;
};

export const useAuthzGetFetcher = async <T>(url: string) => {
  const token = readLocalStorageValue('vines-token', '', false);
  if (!token) {
    throw new Error('需要登录');
  }

  return (await fetch(url, {
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Authentication: 'Bearer ' + token,
    },
  }).then(async (r) => wrapper<T>(await r.json()))) as T;
};
