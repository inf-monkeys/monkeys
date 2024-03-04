import { vinesFetcher } from '@/apis/fetcher.ts';
import { IMd5Response } from '@/apis/resources/typting.ts';

export const getResourceByMd5 = (md5: string) =>
  vinesFetcher<IMd5Response>({ method: 'GET' })('/api/resources/md5/' + md5);
