import stringify from 'fast-json-stable-stringify';
import { toast } from 'sonner';

import { CommonFetcherResponse } from '@/apis/fetcher.ts';
import { readLocalStorageValue } from '@/utils';

const fetchData = async <T, U = undefined>(url: string, method: string, arg?: U): Promise<T | null> => {
  const token = readLocalStorageValue('vines-token', '', false);

  if (!token) {
    toast.warning('需要登录');
    return null;
  }

  const teamId = readLocalStorageValue('vines-team-id', '', false);

  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
    Authentication: `Bearer ${token}`,
    Team: teamId,
  };

  const body = arg ? stringify(arg) : undefined;

  const result = (await fetch(url, {
    method,
    headers,
    body,
  }).then(async (r) => await r.json())) as CommonFetcherResponse<T>;

  const code = result?.code;
  const data = result?.data || void 0;

  if (code && code !== 200) {
    const errorMessage = result?.message || null;

    if (code === 403) {
      if (errorMessage) {
        toast.warning(errorMessage);
        return null;
      }
      toast.warning('需要登录');
    } else {
      toast.warning(errorMessage || '网络错误');
    }

    return null;
  }

  return data as T;
};

export const authzFetcher = <T>(url: string) => fetchData<T>(url, 'GET');

export const useAuthzPostFetcher = <T, U>(url: string, arg: U) => fetchData<T, U>(url, 'POST', arg);

export const simpleGet = async <T>(url: string) => (await fetch(url).then(async (r) => (await r.json())?.data)) as T;

export const simplePost = async <T, U>(url: string, arg: U) =>
  (await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: stringify(arg),
  }).then(async (r) => (await r.json())?.data)) as T;

export const simpleFilePut = async (url: string, file: File, process: (value: number) => void) => {
  const form = new FormData();
  form.set('file', file);

  const req = new XMLHttpRequest();
  req.open('PUT', url);

  req.upload.addEventListener('progress', function (e) {
    const percentComplete = (e.loaded / e.total) * 100;
    process(percentComplete);
  });

  req.addEventListener('load', function () {
    console.log(req.status);
    console.log(req.response);
  });

  req.send(form);
};
