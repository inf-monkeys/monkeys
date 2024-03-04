import stringify from 'fast-json-stable-stringify';

export const authzDeleteFetcher = <T, U>(url: string, arg: U) => fetchData<T, U>(url, 'DELETE', arg);

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
): Promise<XMLHttpRequest> =>
  new Promise((resolve, reject) => {
    const form = new FormData();
    form.set('file', file);

    const req = new XMLHttpRequest();
    req.open('PUT', url);

    req.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        process(Math.round((e.loaded / e.total) * 100), e);
      }
    });

    req.onload = () => {
      if (req.status === 200) {
        resolve(req);
      } else {
        reject(new Error(`Request failed with status ${req.status}`));
      }
    };

    req.onerror = () => {
      reject(new Error('Request error'));
    };

    req.send(form);
  });
