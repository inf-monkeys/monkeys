import 'unfetch/polyfill';

export interface CommonFetcherResponse<T> {
  code: number;
  message: string;
  data: T;
}

export const useGetFetcher = (url: string) => fetch(url).then((r) => r.json());
