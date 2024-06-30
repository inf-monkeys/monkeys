import { stringify } from '@/utils/fast-stable-stringify.ts';

export const simpleGet = async <T>(url: string) => (await fetch(url).then(async (r) => (await r.json())?.data)) as T;

export const simplePost = async <T, U>(url: string, arg: U) =>
  (await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: stringify(arg),
  }).then(async (r) => (await r.json())?.data)) as T;

export const simpleFilePut = (
  url: string,
  file: File,
  process: (value: number, event: ProgressEvent<XMLHttpRequestEventTarget>) => void,
  method = 'PUT',
  headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  params: Record<string, string> = {},
): Promise<XMLHttpRequest> =>
  new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open(method, url);

    Object.entries(headers).forEach(([key, value]) => req.setRequestHeader(key, value));

    req.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        process(Math.round((e.loaded / e.total) * 100), e);
      }
    });

    req.onload = () => {
      if (req.status === 200 || req.status === 201) {
        resolve(req);
      } else {
        reject(new Error(`Request failed with status ${req.status}`));
      }
    };

    req.onerror = () => {
      reject(new Error('Request error'));
    };

    if (method === 'POST') {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => formData.append(key, value));
      formData.append('file', file);
      req.send(formData);
    } else {
      req.send(file);
    }
  });
